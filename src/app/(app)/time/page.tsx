"use client";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import ChartCard from "@/components/ui/ChartCard";
import StatCard from "@/components/ui/StatCard";
import { MOCK_TIME_THIS_WEEK, BUCKET_META, getTotalByBucket, DAILY_TIME } from "@/lib/data";

const totals = getTotalByBucket(MOCK_TIME_THIS_WEEK);
const CHART_DATA = Object.entries(totals).map(([b, h]) => ({
  name: BUCKET_META[b as keyof typeof BUCKET_META].label,
  value: h,
  color: BUCKET_META[b as keyof typeof BUCKET_META].color,
}));

const ALIGN_DATA = [
  { name: "Family",   stated: 90, actual: 8 },
  { name: "Work",     stated: 70, actual: 46 },
  { name: "Health",   stated: 60, actual: 12 },
  { name: "Growth",   stated: 50, actual: 5 },
  { name: "Projects", stated: 40, actual: 0 },
];

const DAILY_KEYS = ["work","family","health","growth","leisure","admin"] as const;

export default function TimePage() {
  return (
    <div className="fade-up px-9 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#F0F5F1]">⏱ Time Pillar</h1>
          <p className="text-sm text-[#3A4A3E] mt-1">68 hours tracked this week across 6 life areas</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon="💼" label="Work"   value="31h"   delta="Priority #2 · Over-indexed"   deltaType="down" />
        <StatCard icon="💪" label="Health" value="8h"    delta="Priority #3 · Well aligned"   deltaType="up" />
        <StatCard icon="❤️"  label="Family" value="5.4h"  delta="Priority #1 · Under-invested" deltaType="down" />
        <StatCard icon="📚" label="Growth" value="3.2h"  delta="Priority #4 · Near target"    deltaType="neutral" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <ChartCard title="Time Split" subtitle="By life area this week">
          <div className="flex gap-4 items-center">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={CHART_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={3}>
                  {CHART_DATA.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}h`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {CHART_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-[#6B7F70] flex-1">{d.name}</span>
                  <span className="text-xs font-bold text-slate-700">{d.value}h</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Time vs Priority" subtitle="Actual % vs your stated values ranking">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ALIGN_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="stated" name="Priority weight" fill="#DBEAFE" radius={4} />
              <Bar dataKey="actual" name="Actual % of week" fill="#1A56DB" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Daily Breakdown" subtitle="Stacked hours by life area across the week">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={DAILY_TIME} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => [`${v}h`, ""]} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            {DAILY_KEYS.map((key) => (
              <Bar key={key} dataKey={key} stackId="a" fill={BUCKET_META[key].color} name={BUCKET_META[key].label} radius={key === "admin" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
