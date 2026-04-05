"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type LifeBucket = "family" | "work" | "health" | "growth" | "leisure" | "admin";

const VALUES = [
  { key: "family" as LifeBucket,  emoji: "❤️",  label: "Family & Relationships" },
  { key: "work" as LifeBucket,    emoji: "💼", label: "Career & Work" },
  { key: "health" as LifeBucket,  emoji: "💪", label: "Health & Fitness" },
  { key: "growth" as LifeBucket,  emoji: "📚", label: "Learning & Growth" },
  { key: "leisure" as LifeBucket, emoji: "🎮", label: "Leisure & Fun" },
  { key: "admin" as LifeBucket,   emoji: "📋", label: "Admin & Errands" },
];

const SOURCES = [
  { id: "bank",     icon: "🏦", label: "Bank & Finance",   desc: "Auto-track spending via Plaid", badge: "connect" },
  { id: "calendar", icon: "📅", label: "Google Calendar",  desc: "Sync events and time automatically", badge: "connect" },
  { id: "screen",   icon: "📱", label: "Screen Time",      desc: "Upload iOS or Android export", badge: "upload" },
  { id: "manual",   icon: "✍️", label: "Manual Entry",     desc: "Always available — log anything", badge: "on", always: true },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep]             = useState(0); // 0=welcome, 1=values, 2=sources, 3=sample
  const [priorities, setPriorities] = useState<LifeBucket[]>(VALUES.map(v => v.key));
  const [connected, setConnected]   = useState<string[]>([]);
  const [saving, setSaving]         = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function toggleSource(id: string) {
    setConnected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPriorities = [...priorities];
    const draggedItem = newPriorities[draggedIndex];
    newPriorities.splice(draggedIndex, 1);
    newPriorities.splice(index, 0, draggedItem);
    
    setPriorities(newPriorities);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  async function savePriorities() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priorities }),
      });
      setStep(2);
    } catch (error) {
      console.error("Failed to save priorities:", error);
      alert("Failed to save priorities. Please try again.");
    }
    setSaving(false);
  }

  async function completeOnboarding(withSampleData: boolean) {
    setSaving(true);
    
    if (withSampleData) {
      // Create sample data
      const today = new Date().toISOString().split("T")[0];
      
      const sampleTimeEntries = [
        { label: "Morning workout", bucket: "health", hours: 1, entry_date: today },
        { label: "Team meeting", bucket: "work", hours: 2, entry_date: today },
        { label: "Dinner with family", bucket: "family", hours: 1.5, entry_date: today },
      ];
      
      const sampleExpenses = [
        { label: "Groceries", bucket: "health", amount: 3000, entry_date: today },
        { label: "Restaurant", bucket: "family", amount: 2000, entry_date: today },
      ];
      
      try {
        await Promise.all([
          ...sampleTimeEntries.map(entry => 
            fetch("/api/entries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(entry),
            })
          ),
          ...sampleExpenses.map(expense =>
            fetch("/api/expenses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(expense),
            })
          ),
        ]);
      } catch (error) {
        console.error("Failed to create sample data:", error);
      }
    }
    
    setSaving(false);
    router.push("/dashboard");
  }

  // ── WELCOME ──
  if (step === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center px-6 py-12">
      <div className="text-[11px] uppercase tracking-[4px] text-white/30 mb-8">Life Audit App</div>
      <h1 className="text-5xl md:text-6xl font-black text-white text-center leading-tight mb-4">
        Know where your<br />
        <span className="text-[#818CF8]">life is actually going.</span>
      </h1>
      <p className="text-lg text-white/60 text-center max-w-lg leading-relaxed mb-12">
        Most people live someone else&apos;s life by accident. Life Audit shows you where your time, money, and attention truly go — then helps you align them with what matters.
      </p>
      <div className="flex gap-4 mb-12 flex-wrap justify-center">
        {[
          { icon: "⏱", label: "Time",      desc: "Where does your day go?" },
          { icon: "💰", label: "Money",     desc: "What does spending say?" },
          { icon: "🧠", label: "Attention", desc: "What feeds your mind?" },
        ].map((p) => (
          <div key={p.label} className="bg-white/8 backdrop-blur border border-white/12 rounded-2xl p-5 text-center w-44">
            <div className="text-3xl mb-2">{p.icon}</div>
            <div className="text-white font-bold text-sm">{p.label}</div>
            <div className="text-white/45 text-xs mt-1">{p.desc}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setStep(1)}
        className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform"
      >
        Start Your Audit →
      </button>
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-4 text-white/40 text-sm hover:text-white/70 transition-colors underline underline-offset-2"
      >
        Skip to dashboard preview
      </button>
    </div>
  );

  // ── VALUES ──
  if (step === 1) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full">
        {/* Steps */}
        <div className="flex gap-2 mb-8">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= 1 ? "bg-[#1A56DB]" : "bg-slate-200"}`} />
          ))}
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">What matters most to you right now?</h2>
        <p className="text-sm text-slate-400 mb-2">Drag to reorder. #1 gets the most weight in your alignment score.</p>
        <p className="text-xs text-amber-600 mb-7">💡 Tip: This isn&apos;t forever—you can change these anytime in Settings</p>
        
        <div className="space-y-2.5 mb-8">
          {priorities.map((key, i) => {
            const v = VALUES.find(val => val.key === key)!;
            return (
              <div
                key={v.key}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-move ${
                  draggedIndex === i ? "opacity-50 scale-95" : ""
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#1A56DB] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-lg">{v.emoji}</span>
                <span className="font-semibold text-slate-700 text-sm flex-1">{v.label}</span>
                <div className="text-slate-400 text-xs">⋮⋮</div>
              </div>
            );
          })}
        </div>
        
        <button
          onClick={savePriorities}
          disabled={saving}
          className="w-full bg-[#1A56DB] text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save My Priorities →"}
        </button>
      </div>
    </div>
  );

  // ── CONNECT ──
  if (step === 2) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full">
        <div className="flex gap-2 mb-8">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= 2 ? "bg-[#1A56DB]" : "bg-slate-200"}`} />
          ))}
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Connect your data sources</h2>
        <p className="text-sm text-slate-400 mb-7">The more you connect, the sharper your audit. You can set these up later in Settings.</p>
        <div className="space-y-3 mb-8">
          {SOURCES.map((s) => {
            const isOn = s.always || connected.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => !s.always && toggleSource(s.id)}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-4 transition-all ${
                  s.always ? "border-amber-200 bg-amber-50 cursor-default" :
                  isOn ? "border-emerald-300 bg-emerald-50 cursor-pointer" :
                  "border-slate-200 cursor-pointer hover:border-blue-300"
                }`}
              >
                <div className="text-2xl">{s.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 text-sm">{s.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  s.always ? "bg-amber-100 text-amber-700" :
                  isOn ? "bg-emerald-100 text-emerald-700" :
                  "bg-blue-50 text-blue-600"
                }`}>
                  {s.always ? "Always On" : isOn ? "✓ Will setup" : s.badge === "upload" ? "Upload" : "Connect"}
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setStep(3)}
          className="w-full bg-[#1A56DB] text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all"
        >
          Continue →
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="w-full mt-3 text-slate-500 text-sm hover:text-slate-700 transition-colors"
        >
          I&apos;ll set these up later
        </button>
      </div>
    </div>
  );

  // ── SAMPLE DATA ──
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full">
        <div className="flex gap-2 mb-8">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= 3 ? "bg-[#1A56DB]" : "bg-slate-200"}`} />
          ))}
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">One last thing...</h2>
        <p className="text-sm text-slate-400 mb-7">Want to see how the app works with some sample data?</p>
        
        <div className="space-y-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Start with sample data</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We&apos;ll add a few example entries so you can see charts, insights, and how everything works. You can delete them anytime.
                </p>
              </div>
            </div>
            <button
              onClick={() => completeOnboarding(true)}
              disabled={saving}
              className="w-full bg-[#1A56DB] text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {saving ? "Setting up..." : "Yes, show me with examples"}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Start from scratch</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jump straight to your dashboard and start logging your real data right away.
                </p>
              </div>
            </div>
            <button
              onClick={() => completeOnboarding(false)}
              disabled={saving}
              className="w-full bg-white border-2 border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {saving ? "Setting up..." : "No thanks, I'll add my own"}
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-slate-400">
          You can always change your priorities and data sources in Settings
        </p>
      </div>
    </div>
  );
}
