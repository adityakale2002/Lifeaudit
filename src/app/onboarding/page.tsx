"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const VALUES = [
  { key: "family",   emoji: "❤️",  label: "Family & Relationships" },
  { key: "work",     emoji: "💼", label: "Career & Work" },
  { key: "health",   emoji: "💪", label: "Health & Fitness" },
  { key: "growth",   emoji: "📚", label: "Learning & Growth" },
  { key: "projects", emoji: "🎯", label: "Personal Projects" },
  { key: "leisure",  emoji: "🌍", label: "Adventure & Travel" },
];

const SOURCES = [
  { id: "bank",     icon: "🏦", label: "Bank & Finance",   desc: "Auto-track spending via Plaid", badge: "connect" },
  { id: "calendar", icon: "📅", label: "Google Calendar",  desc: "Sync events and time automatically", badge: "connect" },
  { id: "screen",   icon: "📱", label: "Screen Time",      desc: "Upload iOS or Android export", badge: "upload" },
  { id: "manual",   icon: "✍️", label: "Manual Entry",     desc: "Always available — log anything", badge: "on", always: true },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]             = useState(0); // 0=welcome, 1=values, 2=connect
  const [connected, setConnected]   = useState<string[]>([]);

  function toggleSource(id: string) {
    setConnected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
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
          { icon: "💷", label: "Money",     desc: "What does spending say?" },
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full">
        {/* Steps */}
        <div className="flex gap-2 mb-8">
          {[0,1,2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= 1 ? "bg-[#1A56DB]" : "bg-slate-200"}`} />
          ))}
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">What matters most to you right now?</h2>
        <p className="text-sm text-slate-400 mb-7">These become your north star. We compare them against your actual data weekly.</p>
        <div className="space-y-2.5 mb-8">
          {VALUES.map((v, i) => (
            <div key={v.key}
              className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-default">
              <div className="w-7 h-7 rounded-full bg-[#1A56DB] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-lg">{v.emoji}</span>
              <span className="font-semibold text-slate-700 text-sm">{v.label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStep(2)}
          className="w-full bg-[#1A56DB] text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all"
        >
          Save My Priorities →
        </button>
      </div>
    </div>
  );

  // ── CONNECT ──
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full">
        <div className="flex gap-2 mb-8">
          {[0,1,2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= 2 ? "bg-[#1A56DB]" : "bg-slate-200"}`} />
          ))}
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Connect your data sources</h2>
        <p className="text-sm text-slate-400 mb-7">The more you connect, the sharper your audit. Add more any time.</p>
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
                  {s.always ? "Always On" : isOn ? "✓ Connected" : s.badge === "upload" ? "Upload" : "Connect"}
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-[#1A56DB] text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all"
        >
          Launch My Dashboard →
        </button>
      </div>
    </div>
  );
}
