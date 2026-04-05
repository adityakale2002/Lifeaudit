"use client";
import { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import ChartCard from "@/components/ui/ChartCard";
import AlignmentBanner from "@/components/ui/AlignmentBanner";
import InsightCard from "@/components/ui/InsightCard";
import { Clock, IndianRupee, Cpu, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  MOCK_TIME_THIS_WEEK, MOCK_EXPENSES, BUCKET_META, DAILY_TIME,
  getTotalByBucket, getTotalExpenseByBucket,
} from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import type { TimeEntry, Expense, LifeBucket } from "@/lib/supabase/types";

const DAILY_KEYS = ["work","family","health","growth","leisure","admin"] as const;

function getWeekRange(weeksAgo = 0) {
  const now = new Date(), day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7) - (weeksAgo * 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(mon), to: fmt(sun) };
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div className="bg-[#141C15] border border-[#1C2620] rounded-lg px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[11px] text-[#6B7F70]">{name}</span>
      </div>
      <div className="text-[14px] font-bold text-[#F0F5F1]">{typeof value === "number" ? value.toFixed(1) : value}</div>
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, delta, up }: {
  icon: React.ElementType; label: string; value: string; delta: string; up?: boolean | null;
}) {
  return (
    <div className="bg-[#0F1510] border border-[#1C2620] rounded-xl p-5 hover:border-[#2DD4BF]/20 transition-all group cursor-default">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold text-[#3A4A3E] uppercase tracking-[1.5px]">{label}</span>
        <div className="w-7 h-7 rounded-md bg-[#141C15] border border-[#1C2620] flex items-center justify-center">
          <Icon size={12} className="text-[#3A4A3E] group-hover:text-[#2DD4BF] transition-colors" />
        </div>
      </div>
      <div className="text-[24px] font-bold text-[#F0F5F1] leading-none mb-2">{value}</div>
      <div className={`flex items-center gap-1 text-[11px] font-medium ${up === true ? "text-[#2DD4BF]" : up === false ? "text-[#F87171]" : "text-[#3A4A3E]"}`}>
        {up === true && <ArrowUpRight size={11} />}
        {up === false && <ArrowDownRight size={11} />}
        {delta}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { profile } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [expenses,    setExpenses]    = useState<Expense[]>([]);
  const [lastWeekTimeEntries, setLastWeekTimeEntries] = useState<TimeEntry[]>([]);
  const [lastWeekExpenses,    setLastWeekExpenses]    = useState<Expense[]>([]);
  const [hasRealData, setHasRealData] = useState(false);
  const [loading,     setLoading]     = useState(true);

  const loadData = useCallback(async () => {
    const thisWeek = getWeekRange(0);
    const lastWeek = getWeekRange(1);
    
    const [te, ex, lte, lex] = await Promise.all([
      fetch(`/api/entries?from=${thisWeek.from}&to=${thisWeek.to}`).then((r) => r.json()),
      fetch(`/api/expenses?from=${thisWeek.from}&to=${thisWeek.to}`).then((r) => r.json()),
      fetch(`/api/entries?from=${lastWeek.from}&to=${lastWeek.to}`).then((r) => r.json()),
      fetch(`/api/expenses?from=${lastWeek.from}&to=${lastWeek.to}`).then((r) => r.json()),
    ]);
    
    const entries = (te.data ?? []) as TimeEntry[];
    const exps    = (ex.data ?? []) as Expense[];
    const lastEntries = (lte.data ?? []) as TimeEntry[];
    const lastExps    = (lex.data ?? []) as Expense[];
    
    const hasData = entries.length > 0 || exps.length > 0;
    setTimeEntries(hasData ? entries : MOCK_TIME_THIS_WEEK as unknown as TimeEntry[]);
    setExpenses(hasData    ? exps    : MOCK_EXPENSES as unknown as Expense[]);
    setLastWeekTimeEntries(lastEntries);
    setLastWeekExpenses(lastExps);
    setHasRealData(hasData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const timeTotals = hasRealData
    ? timeEntries.reduce<Partial<Record<LifeBucket, number>>>((acc, e) => {
        acc[e.bucket] = (acc[e.bucket] ?? 0) + Number(e.hours); return acc;
      }, {})
    : getTotalByBucket(MOCK_TIME_THIS_WEEK);

  const expTotals = hasRealData
    ? expenses.reduce<Partial<Record<LifeBucket, number>>>((acc, e) => {
        acc[e.bucket] = (acc[e.bucket] ?? 0) + Number(e.amount); return acc;
      }, {})
    : getTotalExpenseByBucket(MOCK_EXPENSES);

  const totalHours = Object.values(timeTotals).reduce((s, v) => s + (v ?? 0), 0);
  const totalSpend = Object.values(expTotals).reduce((s, v) => s + (v ?? 0), 0);

  // Last week totals for comparison
  const lastWeekTimeTotals = lastWeekTimeEntries.reduce<Partial<Record<LifeBucket, number>>>((acc, e) => {
    acc[e.bucket] = (acc[e.bucket] ?? 0) + Number(e.hours); return acc;
  }, {});
  const lastWeekExpTotals = lastWeekExpenses.reduce<Partial<Record<LifeBucket, number>>>((acc, e) => {
    acc[e.bucket] = (acc[e.bucket] ?? 0) + Number(e.amount); return acc;
  }, {});
  
  const lastTotalHours = Object.values(lastWeekTimeTotals).reduce((s, v) => s + (v ?? 0), 0);
  const lastTotalSpend = Object.values(lastWeekExpTotals).reduce((s, v) => s + (v ?? 0), 0);
  
  const hoursDelta = totalHours - lastTotalHours;
  const spendDelta = totalSpend - lastTotalSpend;

  const TIME_DATA = Object.entries(timeTotals)
    .map(([b, h]) => ({ name: BUCKET_META[b as LifeBucket].label, value: h, color: BUCKET_META[b as LifeBucket].color }))
    .filter((d) => d.value && d.value > 0);

  const MONEY_DATA = Object.entries(expTotals)
    .map(([b, v]) => ({ name: BUCKET_META[b as LifeBucket].label, value: v, color: BUCKET_META[b as LifeBucket].color }))
    .filter((d) => d.value && d.value > 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const priorities    = profile?.priorities ?? ["family","work","health","growth","leisure","admin"];
  const topPriority   = priorities[0] as LifeBucket;
  const topPct        = totalHours > 0 ? Math.round(((timeTotals[topPriority] ?? 0) / totalHours) * 100) : 0;
  const workPct       = totalHours > 0 ? Math.round(((timeTotals["work"] ?? 0) / totalHours) * 100) : 0;
  const alignScore    = Math.min(100, Math.max(0, 100 - Math.abs(35 - topPct) * 2));
  const firstName     = profile?.full_name?.split(" ")[0] ?? "there";
  const hour          = new Date().getHours();
  const greeting      = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-2 text-[#3A4A3E] text-[13px]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
        Loading
      </div>
    </div>
  );

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-8 pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[2px] text-[#3A4A3E] mb-1">{greeting}</p>
          <h1 className="text-[22px] font-bold text-[#F0F5F1] leading-none">{firstName}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!hasRealData && (
            <a href="/entry" className="text-[12px] font-medium px-4 py-2 rounded-lg bg-[#FB923C]/8 border border-[#FB923C]/15 text-[#FB923C] hover:bg-[#FB923C]/15 transition-all">
              Log first entry
            </a>
          )}
          <a href="/report" className="text-[12px] font-medium px-4 py-2 rounded-lg bg-[#2DD4BF] text-[#080C0A] hover:bg-[#5EEAD4] transition-all font-semibold">
            Generate Report
          </a>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-5">

        {/* Alignment banner */}
        <AlignmentBanner
          score={Math.round(alignScore)}
          headline={`Alignment Score: ${alignScore >= 75 ? "Strong" : alignScore >= 50 ? "Moderate" : "Needs attention"}`}
          description={
            totalHours === 0
              ? "Start logging your time to see your alignment score."
              : `${topPct}% of your week went to ${BUCKET_META[topPriority].label} — your #1 priority. Work consumed ${workPct}%.`
          }
          chips={[
            { label: `Health: ${(timeTotals["health"] ?? 0) > 3 ? "on track" : "needs attention"}`, type: (timeTotals["health"] ?? 0) > 3 ? "green" : "amber" },
            { label: `Work ${workPct}%`, type: workPct > 45 ? "red" : workPct > 35 ? "amber" : "green" },
            { label: `${BUCKET_META[topPriority].label} ${topPct}% (#1)`, type: topPct >= 20 ? "green" : topPct >= 10 ? "amber" : "red" },
          ]}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard 
            icon={Clock} 
            label="Hours Tracked" 
            value={`${totalHours.toFixed(1)}h`}
            delta={hasRealData && lastTotalHours > 0 
              ? `${hoursDelta >= 0 ? '+' : ''}${hoursDelta.toFixed(1)}h vs last week`
              : hasRealData ? "This week" : "Sample"}
            up={hoursDelta > 0 ? true : hoursDelta < 0 ? false : null}
          />
          <StatCard 
            icon={IndianRupee} 
            label="Total Spend" 
            value={`₹${totalSpend.toFixed(0)}`}
            delta={hasRealData && lastTotalSpend > 0
              ? `${spendDelta >= 0 ? '+' : ''}₹${Math.abs(spendDelta).toFixed(0)} vs last week`
              : hasRealData ? "This week" : "Sample"}
            up={spendDelta < 0 ? true : spendDelta > 0 ? false : null}
          />
          <StatCard icon={Cpu}            label="Screen Time"    value="—"                                     delta="Upload to track" />
          <StatCard icon={Activity}       label="Alignment"      value={`${Math.round(alignScore)}%`}
            delta={alignScore >= 70 ? "Looking good" : "Room to improve"}
            up={alignScore >= 70 ? true : false}
          />
        </div>

        {/* Top 2 charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Donut — Time */}
          <ChartCard title="Time by Area" subtitle={`${totalHours.toFixed(1)}h tracked this week`} tag={hasRealData ? "Live" : "Sample"}>
            {TIME_DATA.length > 0 ? (
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={TIME_DATA} cx="50%" cy="50%"
                        innerRadius={48} outerRadius={72}
                        dataKey="value" paddingAngle={2} strokeWidth={0}
                      >
                        {TIME_DATA.map((e) => <Cell key={e.name} fill={e.color} opacity={0.9} />)}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[18px] font-bold text-[#F0F5F1]">{totalHours.toFixed(0)}</span>
                    <span className="text-[9px] text-[#3A4A3E] uppercase tracking-[1px]">hours</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {TIME_DATA.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[11px] text-[#6B7F70] flex-1 truncate">{d.name}</span>
                      <span className="text-[11px] font-semibold text-[#F0F5F1]">{(d.value ?? 0).toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[160px] gap-2">
                <div className="w-12 h-12 rounded-xl bg-[#141C15] border border-[#1C2620] flex items-center justify-center">
                  <Clock size={18} className="text-[#3A4A3E]" />
                </div>
                <p className="text-[12px] text-[#3A4A3E]">Log time entries to see chart</p>
              </div>
            )}
          </ChartCard>

          {/* Horizontal bars — Spending */}
          <ChartCard title="Spending by Area" subtitle={`₹${totalSpend.toFixed(0)} this week`} tag={hasRealData ? "Live" : "Sample"}>
            {MONEY_DATA.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MONEY_DATA} layout="vertical" barSize={10} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#3A4A3E" }} tickFormatter={(v) => `₹${v}`}
                    axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6B7F70" }}
                    width={65} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "#1C2620" }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} background={{ fill: "#141C15", radius: 3 }}>
                    {MONEY_DATA.map((e) => <Cell key={e.name} fill={e.color} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] gap-2">
                <div className="w-12 h-12 rounded-xl bg-[#141C15] border border-[#1C2620] flex items-center justify-center">
                  <IndianRupee size={18} className="text-[#3A4A3E]" />
                </div>
                <p className="text-[12px] text-[#3A4A3E]">Log expenses to see chart</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Stacked daily chart */}
        <ChartCard title="Daily Distribution" subtitle="Hours per life area across the week" tag="7 days">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DAILY_TIME} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1C2620" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#3A4A3E" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#3A4A3E" }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "#141C15" }} />
              {DAILY_KEYS.map((key) => (
                <Bar key={key} dataKey={key} stackId="a"
                  fill={BUCKET_META[key].color}
                  name={BUCKET_META[key].label}
                  opacity={0.88}
                  radius={key === "admin" ? [3,3,0,0] : [0,0,0,0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          {/* Custom legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#1C2620]">
            {DAILY_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: BUCKET_META[key].color, opacity: 0.88 }} />
                <span className="text-[10px] text-[#6B7F70]">{BUCKET_META[key].label}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Insights */}
        <div>
          <p className="text-[10px] uppercase tracking-[2px] text-[#3A4A3E] mb-3 font-semibold">Insights</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InsightCard type="gap" tag="Alignment Gap"
              text={<>Your #1 priority is <strong className="text-[#F0F5F1]">{BUCKET_META[topPriority].label}</strong>, but it only received <strong className="text-[#F0F5F1]">{topPct}%</strong> of your week.</>}
              action="→ Log an entry now" />
            <InsightCard type="win" tag="Momentum"
              text={<><strong className="text-[#F0F5F1]">Consistent logging</strong> for 2 weeks unlocks your first AI audit report with real patterns.</>}
              action="→ View report" />
            <InsightCard type="info" tag="Quick Win"
              text={<>Connect <strong className="text-[#F0F5F1]">Google Calendar</strong> in Settings to auto-fill time data — no manual logging for meetings.</>}
              action="→ Open settings" />
          </div>
        </div>

      </div>
    </div>
  );
}
