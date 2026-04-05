"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import ChartCard from "@/components/ui/ChartCard";
import StatCard from "@/components/ui/StatCard";
import { MOCK_EXPENSES, BUCKET_META, getTotalExpenseByBucket } from "@/lib/data";

const totals = getTotalExpenseByBucket(MOCK_EXPENSES);
const CHART_DATA = Object.entries(totals)
  .map(([b, v]) => ({ name: BUCKET_META[b as keyof typeof BUCKET_META].label, value: v, color: BUCKET_META[b as keyof typeof BUCKET_META].color }))
  .sort((a, b) => b.value - a.value);

const TREND = [
  { week: "4 wks ago", convenience: 148, health: 110 },
  { week: "3 wks ago", convenience: 172, health: 125 },
  { week: "2 wks ago", convenience: 190, health: 120 },
  { week: "This week", convenience: 226, health: 130 },
];

export default function MoneyPage() {
  const total = Object.values(totals).reduce((s, v) => s + (v ?? 0), 0);
  return (
    <div className="fade-up px-9 py-8">
      <h1 className="text-2xl font-black text-[#F0F5F1] mb-1">💰 Money Pillar</h1>
      <p className="text-sm text-[#3A4A3E] mb-6">₹{total} tracked this week via bank sync</p>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon="🛒" label="Convenience" value="₹226" delta="26% of total · ↑ ₹60 vs avg" deltaType="down" />
        <StatCard icon="💪" label="Health"       value="₹130" delta="15% · Well aligned ✓"         deltaType="up" />
        <StatCard icon="❤️"  label="Family"       value="₹98"  delta="12% of total"                  deltaType="neutral" />
        <StatCard icon="📚" label="Growth"       value="₹42"  delta="5% · Below priority"          deltaType="down" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <ChartCard title="Spending by Life Area" subtitle={`₹${total} this week`} tag="Bank sync">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CHART_DATA} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={72} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`₹${v}`, ""]} />
              <Bar dataKey="value" radius={4}>
                {CHART_DATA.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spending Trend" subtitle="Last 4 weeks — convenience vs health">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`₹${v}`, ""]} />
              <Line type="monotone" dataKey="convenience" stroke="#1A56DB" strokeWidth={2.5} dot={{ r: 4 }} name="Convenience" />
              <Line type="monotone" dataKey="health"      stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4 }} name="Health" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Transaction list */}
      <div className="bg-[#0F1510] rounded-xl border border-[#1C2620] p-6">
        <h3 className="text-[15px] font-bold text-[#F0F5F1] mb-4">Recent Transactions</h3>
        <div className="divide-y divide-slate-50">
          {MOCK_EXPENSES.map((e) => {
            const meta = BUCKET_META[e.bucket];
            return (
              <div key={e.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: meta.bg }}>
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-700">{e.label}</div>
                  <div className="text-xs text-[#3A4A3E] mt-0.5">{meta.label} · {e.date} · {e.source}</div>
                </div>
                <div className="text-sm font-bold text-[#F0F5F1]">₹{e.amount}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
