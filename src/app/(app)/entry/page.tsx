"use client";
import { useState, useEffect, useCallback } from "react";
import { BUCKET_META } from "@/lib/data";
import type { LifeBucket } from "@/lib/supabase/types";
import type { TimeEntry, Expense } from "@/lib/supabase/types";

const BUCKETS = Object.entries(BUCKET_META) as [LifeBucket, typeof BUCKET_META[LifeBucket]][];

type Tab = "time" | "expense" | "attention";

export default function EntryPage() {
  const [activeTab, setActiveTab]       = useState<Tab>("time");
  const [activeBucket, setActiveBucket] = useState<LifeBucket>("family");
  const [label, setLabel]               = useState("");
  const [value, setValue]               = useState("");  // hours or amount
  const [entryDate, setEntryDate]       = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote]                 = useState("");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [recentTime, setRecentTime]     = useState<TimeEntry[]>([]);
  const [recentExp, setRecentExp]       = useState<Expense[]>([]);

  const loadRecent = useCallback(async () => {
    const [te, ex] = await Promise.all([
      fetch("/api/entries?").then((r) => r.json()),
      fetch("/api/expenses?").then((r) => r.json()),
    ]);
    setRecentTime((te.data ?? []).slice(0, 5));
    setRecentExp((ex.data ?? []).slice(0, 5));
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const endpoint   = activeTab === "expense" ? "/api/expenses" : "/api/entries";
    const dateStr    = entryDate.split("T")[0];
    const payload    = activeTab === "expense"
      ? { label, bucket: activeBucket, amount: value, entry_date: dateStr, note }
      : { label, bucket: activeBucket, hours: value, entry_date: dateStr, note };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
    } else {
      setSaved(true);
      setLabel(""); setValue(""); setNote("");
      await loadRecent();
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function deleteEntry(id: string, type: "time" | "expense") {
    const endpoint = type === "time" ? `/api/entries?id=${id}` : `/api/expenses?id=${id}`;
    await fetch(endpoint, { method: "DELETE" });
    await loadRecent();
  }

  const recent = activeTab === "expense" ? recentExp : recentTime;

  return (
    <div className="fade-up px-4 sm:px-9 py-8">
      <h1 className="text-2xl font-black text-[#F0F5F1] mb-1">Manual Entry</h1>
      <p className="text-sm text-[#3A4A3E] mb-6">Log your time, money, or attention manually</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#141C15] rounded-xl p-1 w-fit mb-6">
        {(["time","expense","attention"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t ? "bg-[#0F1510] text-[#F0F5F1] shadow-sm" : "text-[#3A4A3E] hover:text-[#6B7F70]"}`}>
            {t === "time" ? "⏱ Time" : t === "expense" ? "💰 Expense" : "🧠 Attention"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Form */}
        <div className="bg-[#0F1510] rounded-xl border border-[#1C2620] p-6">
          <h3 className="text-[15px] font-bold text-[#F0F5F1] mb-5">
            {activeTab === "time" ? "Log Time Block" : activeTab === "expense" ? "Log Expense" : "Log Attention"}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#3A4A3E] uppercase tracking-wider mb-1.5">
                {activeTab === "time" ? "What did you do?" : activeTab === "expense" ? "What did you spend on?" : "What were you doing?"}
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#141C15] border border-[#1C2620] rounded-lg text-sm text-[#F0F5F1] placeholder-[#3A4A3E] focus:outline-none focus:border-[#2DD4BF]/40 focus:ring-1 focus:ring-[#2DD4BF]/10 transition-all"
                placeholder={activeTab === "time" ? "e.g. Dinner with family" : activeTab === "expense" ? "e.g. Gym membership" : "e.g. Scrolling Instagram"}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A4A3E] uppercase tracking-wider mb-1.5">Life Area</label>
              <div className="grid grid-cols-2 gap-2">
                {BUCKETS.map(([key, meta]) => (
                  <button type="button" key={key} onClick={() => setActiveBucket(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${activeBucket === key ? "text-white border-transparent" : "border-[#1C2620] text-[#6B7F70] hover:border-[#243028] bg-[#0F1510]"}`}
                    style={activeBucket === key ? { background: meta.color } : {}}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color }} /> {meta.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A4A3E] uppercase tracking-wider mb-1.5">
                {activeTab === "expense" ? "Amount (₹)" : "Duration (hours)"}
              </label>
              <input
                type="number"
                step="0.25"
                min="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#141C15] border border-[#1C2620] rounded-lg text-sm text-[#F0F5F1] placeholder-[#3A4A3E] focus:outline-none focus:border-[#2DD4BF]/40 focus:ring-1 focus:ring-[#2DD4BF]/10 transition-all"
                placeholder={activeTab === "expense" ? "e.g. 45.00" : "e.g. 1.5"}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A4A3E] uppercase tracking-wider mb-1.5">Date & Time</label>
              <input type="datetime-local" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#141C15] border border-[#1C2620] rounded-lg text-sm text-[#F0F5F1] placeholder-[#3A4A3E] focus:outline-none focus:border-[#2DD4BF]/40 focus:ring-1 focus:ring-[#2DD4BF]/10 transition-all" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#3A4A3E] uppercase tracking-wider mb-1.5">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#141C15] border border-[#1C2620] rounded-lg text-sm text-[#F0F5F1] placeholder-[#3A4A3E] focus:outline-none focus:border-[#2DD4BF]/40 focus:ring-1 focus:ring-[#2DD4BF]/10 transition-all"
                placeholder="Any extra context…" />
            </div>

            {error && <div className="bg-[#F87171]/8 border border-[#F87171]/15 text-[#F87171] text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button type="submit" disabled={saving}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${saved ? "bg-[#2DD4BF] text-[#080C0A]" : "bg-[#2DD4BF] text-[#080C0A] hover:bg-[#5EEAD4] disabled:opacity-40"}`}>
              {saved ? "✓ Saved to database!" : saving ? "Saving…" : `Save ${activeTab === "time" ? "Time Block" : activeTab === "expense" ? "Expense" : "Entry"}`}
            </button>
          </form>
        </div>

        {/* Recent */}
        <div className="bg-[#0F1510] rounded-xl border border-[#1C2620] p-6">
          <h3 className="text-[15px] font-bold text-[#F0F5F1] mb-5">
            Recent {activeTab === "expense" ? "Expenses" : "Time Entries"}
          </h3>
          {recent.length === 0 ? (
            <div className="text-center py-12 text-[#3A4A3E]">
              <div className="w-10 h-10 rounded-lg bg-[#141C15] border border-[#1C2620] flex items-center justify-center mx-auto mb-3"><div className="w-3 h-3 rounded-full border border-[#3A4A3E]" /></div>
              <div className="text-sm">No entries yet — log your first one!</div>
            </div>
          ) : (
            <div className="divide-y divide-[#1C2620]">
              {recent.map((e) => {
                const meta = BUCKET_META[e.bucket as LifeBucket];
                const isTime = activeTab !== "expense";
                const timeEntry = e as TimeEntry;
                const expEntry  = e as Expense;
                return (
                  <div key={e.id} className="flex items-center gap-3 py-3 group">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: meta.bg }}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#F0F5F1] truncate">{e.label}</div>
                      <div className="text-xs text-[#3A4A3E] mt-0.5">{meta.label} · {e.entry_date}</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: meta.color }}>
                      {isTime ? `${timeEntry.hours}h` : `₹${expEntry.amount}`}
                    </div>
                    <button
                      onClick={() => deleteEntry(e.id, isTime ? "time" : "expense")}
                      className="opacity-0 group-hover:opacity-100 text-[#3A4A3E] hover:text-red-400 text-xs ml-1 transition-all"
                      title="Delete">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
