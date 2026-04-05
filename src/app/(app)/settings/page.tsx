"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { useAuth } from "@/context/AuthContext";
import { BUCKET_META } from "@/lib/data";
import type { LifeBucket } from "@/lib/supabase/types";

const BUCKETS = Object.keys(BUCKET_META) as LifeBucket[];
void BUCKETS; // used for type derivation

// ─── Plaid Link sub-component ────────────────────────────────────────────────
function PlaidLinkButton({ onSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plaid/link-token", { method: "POST" })
      .then((r) => r.json())
      .then((j) => {
        if (j.link_token) setLinkToken(j.link_token);
        else setError("Could not load Plaid — check API keys");
      })
      .catch(() => setError("Could not load Plaid"));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken ?? "",
    onSuccess: async (public_token) => {
      setLoading(true);
      await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      setLoading(false);
      onSuccess();
    },
  });

  if (error) return <span className="text-xs text-red-500">{error}</span>;

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E8F0E4] text-[#080C0A] hover:bg-[#2DD4BF]/15 disabled:opacity-50 transition-all"
    >
      {loading ? "Connecting…" : "Connect"}
    </button>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const searchParams         = useSearchParams();
  const [tab, setTab]        = useState("connections");

  // Calendar state
  const [syncing, setSyncing]           = useState(false);
  const [syncMsg, setSyncMsg]           = useState<string | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<"unknown"|"connected"|"disconnected">("unknown");

  // Plaid state
  const [bankConnected,  setBankConnected]  = useState(false);
  const [bankSyncing,    setBankSyncing]    = useState(false);
  const [bankSyncMsg,    setBankSyncMsg]    = useState<string | null>(null);

  // Priorities state
  const [priorities, setPriorities]       = useState<LifeBucket[]>(
    profile?.priorities ?? ["family","work","health","growth","leisure","admin"]
  );
  const [savingPriorities, setSavingPriorities] = useState(false);
  const [prioritiesSaved,  setPrioritiesSaved]  = useState(false);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const calParam = searchParams.get("calendar");
    if (calParam === "connected") {
      setCalendarStatus("connected");
      setSyncMsg("✓ Google Calendar connected! Syncing your events…");
      triggerCalendarSync();
    } else if (calParam === "denied" || calParam === "error") {
      setSyncMsg("Could not connect Google Calendar. Please try again.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function connectCalendar() {
    const res  = await fetch("/api/calendar?action=auth-url");
    const json = await res.json();
    if (json.url) window.location.href = json.url;
  }

  const triggerCalendarSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg("Syncing calendar events…");
    const res  = await fetch("/api/calendar?action=sync");
    const json = await res.json();
    if (res.ok) {
      setSyncMsg(`✓ Synced ${json.synced} events from Google Calendar`);
      setCalendarStatus("connected");
    } else if (json.needsAuth) {
      setSyncMsg(null);
      setCalendarStatus("disconnected");
    } else {
      setSyncMsg(`Error: ${json.error}`);
    }
    setSyncing(false);
  }, []);

  async function syncBank() {
    setBankSyncing(true);
    setBankSyncMsg("Syncing transactions…");
    const res  = await fetch("/api/plaid/sync", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setBankSyncMsg(`✓ Synced ${json.synced} transactions from your bank`);
    } else {
      setBankSyncMsg(`Error: ${json.error}`);
    }
    setBankSyncing(false);
  }

  async function savePriorities() {
    setSavingPriorities(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priorities }),
    });
    setPrioritiesSaved(true);
    setTimeout(() => setPrioritiesSaved(false), 2000);
    setSavingPriorities(false);
  }

  function movePriority(bucket: LifeBucket, dir: "up" | "down") {
    setPriorities((prev) => {
      const idx  = prev.indexOf(bucket);
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  return (
    <div className="fade-up px-4 sm:px-9 py-8">
      <div><p className="text-[10px] uppercase tracking-[2px] text-[#3A4A3E] mb-1">Configuration</p><h1 className="text-[20px] font-bold text-[#F0F5F1]">Settings</h1></div>
      <p className="text-sm text-[#3A4A3E] mb-6">Manage your connections, priorities, and account</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0F1510] border border-[#1C2620] rounded-lg p-1 w-fit mb-6 flex-wrap">
        {["connections","priorities","account"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-[#0F1510] text-[#F0F5F1] shadow-sm" : "text-[#3A4A3E] hover:text-[#6B7F70]"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── CONNECTIONS ── */}
      {tab === "connections" && (
        <div className="space-y-4 max-w-xl">

          {/* Calendar message */}
          {syncMsg && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${syncMsg.startsWith("✓") ? "bg-[#2DD4BF]/8 border-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-[#F87171]/8 border-[#F87171]/15 text-[#F87171]"}`}>
              {syncMsg}
            </div>
          )}

          {/* Bank message */}
          {bankSyncMsg && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${bankSyncMsg.startsWith("✓") ? "bg-[#2DD4BF]/8 border-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-[#F87171]/8 border-[#F87171]/15 text-[#F87171]"}`}>
              {bankSyncMsg}
            </div>
          )}

          {/* ── Bank (Plaid) ── */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${bankConnected ? "border-[#2DD4BF]/20 bg-[#2DD4BF]/5" : "border-[#1C2620] bg-[#0F1510]"}`}>
            <div className="w-8 h-8 rounded-lg bg-[#141C15] border border-[#1C2620] flex items-center justify-center flex-shrink-0"><div className="w-3 h-3 rounded-full border border-[#2DD4BF]/40" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#F0F5F1] text-sm">Bank & Finance</div>
              <div className="text-xs text-[#3A4A3E] mt-0.5 truncate">
                {bankConnected ? "Connected via Plaid — transactions auto-sync" : "Sync bank transactions via Plaid"}
              </div>
            </div>
            {bankConnected ? (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={syncBank} disabled={bankSyncing}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 disabled:opacity-50 transition-all">
                  {bankSyncing ? "Syncing…" : "↻ Sync now"}
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <PlaidLinkButton onSuccess={() => { setBankConnected(true); syncBank(); }} />
              </div>
            )}
          </div>

          {/* ── Google Calendar ── */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${calendarStatus === "connected" ? "border-[#2DD4BF]/20 bg-[#2DD4BF]/5" : "border-[#1C2620] bg-[#0F1510]"}`}>
            <div className="w-8 h-8 rounded-lg bg-[#141C15] border border-[#1C2620] flex items-center justify-center flex-shrink-0"><div className="w-3 h-3 rounded-sm border border-[#60A5FA]/40" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#F0F5F1] text-sm">Google Calendar</div>
              <div className="text-xs text-[#3A4A3E] mt-0.5">
                {calendarStatus === "connected" ? "Connected — events auto-sync weekly" : "Auto-pull events and categorise your time"}
              </div>
            </div>
            <div className="flex-shrink-0">
              {calendarStatus === "connected" ? (
                <button onClick={triggerCalendarSync} disabled={syncing}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 disabled:opacity-50 transition-all">
                  {syncing ? "Syncing…" : "↻ Sync now"}
                </button>
              ) : (
                <button onClick={connectCalendar}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E8F0E4] text-[#080C0A] hover:bg-[#2DD4BF]/15 transition-all">
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* ── Screen Time ── */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-[#1C2620] bg-[#0F1510]">
            <div className="w-8 h-8 rounded-lg bg-[#141C15] border border-[#1C2620] flex items-center justify-center flex-shrink-0"><div className="w-2 h-3 rounded-sm border border-[#A78BFA]/40" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#F0F5F1] text-sm">Screen Time</div>
              <div className="text-xs text-[#3A4A3E] mt-0.5 truncate">Upload iOS Screen Time or Android Digital Wellbeing export</div>
            </div>
            <label className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#141C15] text-[#6B7F70] hover:bg-[#1C2620] transition-all flex-shrink-0 cursor-pointer">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/screen/upload", { method: "POST", body: formData });
                  const json = await res.json();
                  alert(res.ok ? json.message : `Error: ${json.error}`);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {/* Help note */}
          <div className="bg-[#0F1510] border border-[#1C2620] rounded-xl px-5 py-4 mt-2">
            <p className="text-xs text-[#6B7F70] leading-relaxed">
              <strong>Setup:</strong> Add <code className="bg-[#141C15] px-1 rounded text-[#2DD4BF]">PLAID_CLIENT_ID</code>, <code className="bg-[#141C15] px-1 rounded text-[#2DD4BF]">PLAID_SECRET</code>, and <code className="bg-[#141C15] px-1 rounded text-[#2DD4BF]">PLAID_ENV</code> to your <code className="bg-[#141C15] px-1 rounded text-[#2DD4BF]">.env.local</code> for bank sync.
              For Google Calendar, add <code className="bg-[#141C15] px-1 rounded text-[#2DD4BF]">GOOGLE_CLIENT_ID</code> and <code className="bg-[#141C15] px-1 rounded text-[#2DD4BF]">GOOGLE_CLIENT_SECRET</code>.
            </p>
          </div>
        </div>
      )}

      {/* ── PRIORITIES ── */}
      {tab === "priorities" && (
        <div className="max-w-md">
          <p className="text-sm text-[#6B7F70] mb-5 leading-relaxed">
            Your top priority gets the most weight in your alignment score. Reorder to reflect what matters most right now.
          </p>
          <div className="space-y-2 mb-6">
            {priorities.map((bucket, i) => {
              const meta = BUCKET_META[bucket];
              return (
                <div key={bucket} className="flex items-center gap-3 bg-[#0F1510] border border-[#1C2620] rounded-xl px-4 py-3 hover:border-[#2DD4BF]/20 transition-all">
                  <div className="w-5 h-5 rounded-md bg-[#141C15] border border-[#1C2620] text-[#3A4A3E] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                  <span className="text-[13px] font-medium text-[#F0F5F1] flex-1">{meta.label}</span>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => movePriority(bucket, "up")} disabled={i === 0}
                      className="text-[#3A4A3E] hover:text-[#6B7F70] disabled:opacity-20 text-xs leading-none">▲</button>
                    <button onClick={() => movePriority(bucket, "down")} disabled={i === priorities.length - 1}
                      className="text-[#3A4A3E] hover:text-[#6B7F70] disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={savePriorities} disabled={savingPriorities}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${prioritiesSaved ? "bg-[#2DD4BF] text-[#080C0A]" : "bg-[#2DD4BF] text-[#080C0A] hover:bg-[#5EEAD4] disabled:opacity-40"}`}>
            {prioritiesSaved ? "✓ Priorities saved!" : savingPriorities ? "Saving…" : "Save Priorities"}
          </button>
        </div>
      )}

      {/* ── ACCOUNT ── */}
      {tab === "account" && (
        <div className="max-w-sm space-y-4">
          <div className="bg-[#0F1510] border border-[#1C2620] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#141C15] border border-[#2DD4BF]/20 flex items-center justify-center text-[#2DD4BF] font-bold text-sm flex-shrink-0">
                {profile?.full_name?.[0] ?? "A"}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[#F0F5F1] truncate">{profile?.full_name ?? "—"}</div>
                <div className="text-sm text-[#3A4A3E] truncate">{profile?.email ?? "—"}</div>
              </div>
            </div>
            <button onClick={signOut}
              className="w-full py-2.5 rounded-xl border border-[#F87171]/20 text-[#F87171] text-sm font-semibold hover:bg-[#F87171]/8 transition-all">
              Sign Out
            </button>
          </div>

          {/* Export Data */}
          <div className="bg-[#0F1510] border border-[#1C2620] rounded-xl p-6">
            <h3 className="font-bold text-[#F0F5F1] text-sm mb-3">Export Your Data</h3>
            <p className="text-xs text-[#3A4A3E] mb-4">Download all your data for backup or analysis</p>
            <div className="flex gap-2">
              <a
                href="/api/export?format=json"
                download
                className="flex-1 py-2.5 rounded-xl border border-[#2DD4BF]/20 text-[#2DD4BF] text-xs font-semibold hover:bg-[#2DD4BF]/8 transition-all text-center"
              >
                Export JSON
              </a>
              <a
                href="/api/export?format=csv"
                download
                className="flex-1 py-2.5 rounded-xl border border-[#2DD4BF]/20 text-[#2DD4BF] text-xs font-semibold hover:bg-[#2DD4BF]/8 transition-all text-center"
              >
                Export CSV
              </a>
            </div>
          </div>

          <div className="text-xs text-[#3A4A3E] text-center">
            Life Audit App · Phase 6 · Built with Next.js + Supabase + OpenAI
          </div>
        </div>
      )}
    </div>
  );
}
