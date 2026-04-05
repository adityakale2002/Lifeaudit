"use client";
import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import ChartCard from "@/components/ui/ChartCard";
import StatCard from "@/components/ui/StatCard";
import { SCREEN_CATEGORIES, DAILY_SCREEN } from "@/lib/data";

type ScreenEntry = {
  id: string;
  app_name: string;
  category: string;
  hours: number;
  entry_date: string;
};

function getWeekRange() {
  const now = new Date(), day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(mon), to: fmt(sun) };
}

export default function AttentionPage() {
  const [screenEntries, setScreenEntries] = useState<ScreenEntry[]>([]);
  const [hasRealData, setHasRealData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { from, to } = getWeekRange();
    const res = await fetch(`/api/screen?from=${from}&to=${to}`);
    const json = await res.json();
    const entries = (json.data ?? []) as ScreenEntry[];
    setScreenEntries(entries);
    setHasRealData(entries.length > 0);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/screen/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    
    if (res.ok) {
      setUploadMsg(`✓ ${json.message}`);
      await loadData();
    } else {
      setUploadMsg(`Error: ${json.error}`);
    }
    
    setUploading(false);
    e.target.value = "";
  }

  const categoryTotals = hasRealData
    ? screenEntries.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + Number(e.hours);
        return acc;
      }, {})
    : SCREEN_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
        acc[c.category] = c.hours;
        return acc;
      }, {});

  const total = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  const chartData = Object.entries(categoryTotals).map(([category, hours]) => ({
    category,
    hours,
    color: getCategoryColor(category),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-[#3A4A3E] text-[13px]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
          Loading
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up px-9 py-8">
      <h1 className="text-2xl font-black text-[#F0F5F1] mb-1">🧠 Attention Pillar</h1>
      <p className="text-sm text-[#3A4A3E] mb-6">
        {total.toFixed(1)}h of screen time tracked this week {!hasRealData && "(sample data)"}
      </p>

      {/* Upload message */}
      {uploadMsg && (
        <div className={`text-sm px-4 py-3 rounded-xl border mb-5 ${uploadMsg.startsWith("✓") ? "bg-[#2DD4BF]/8 border-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-[#F87171]/8 border-[#F87171]/15 text-[#F87171]"}`}>
          {uploadMsg}
        </div>
      )}

      {/* Upload section */}
      {!hasRealData && (
        <div className="bg-[#0F1510] border border-[#FB923C]/20 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[13px] font-bold text-[#FB923C] mb-1">📊 No screen time data yet</div>
              <p className="text-sm text-[#6B7F70]">
                Upload a CSV export from iOS Screen Time or Android Digital Wellbeing
              </p>
            </div>
            <label className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#2DD4BF] text-[#080C0A] hover:bg-[#5EEAD4] transition-all cursor-pointer">
              {uploading ? "Uploading..." : "Upload CSV"}
              <input
                type="file"
                accept=".csv"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-[#3A4A3E]">
            Expected format: Date,App Name,Category,Hours (one entry per line)
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-5">
        {chartData.slice(0, 4).map((cat) => (
          <StatCard 
            key={cat.category}
            icon={getCategoryIcon(cat.category)} 
            label={cat.category} 
            value={`${cat.hours.toFixed(1)}h`} 
            delta={hasRealData ? "This week" : "Sample"} 
            deltaType="neutral" 
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <ChartCard title="App Usage Breakdown" subtitle={`Screen time by category ${hasRealData ? "(live)" : "(sample)"}`}>
          <div className="flex gap-4 items-center">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="hours" nameKey="category" paddingAngle={3}>
                  {chartData.map((e) => <Cell key={e.category} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}h`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {chartData.map((d) => (
                <div key={d.category} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-[#6B7F70] flex-1">{d.category}</span>
                  <span className="text-xs font-bold text-[#F0F5F1]">{d.hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Daily Screen Time" subtitle="Hours per day this week">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DAILY_SCREEN} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [`${v}h`, "Screen time"]} />
              <Bar dataKey="hours" fill="#818CF8CC" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {hasRealData && (
        <div className="bg-[#0F1510] border border-[#FB923C]/20 rounded-xl p-5">
          <div className="text-[13px] font-bold text-[#FB923C] mb-1">📊 Attention Insight</div>
          <p className="text-sm text-[#6B7F70] leading-relaxed">
            Track your screen time to understand where your attention goes. Upload weekly exports to see patterns and identify areas for improvement.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Social": "#F87171",
    "Productivity": "#2DD4BF",
    "Entertainment": "#818CF8",
    "News & Reading": "#FB923C",
    "Learning": "#34D399",
    "Health": "#10B981",
    "Other": "#6B7280",
  };
  return colors[category] ?? "#6B7280";
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    "Social": "📱",
    "Productivity": "💼",
    "Entertainment": "🎬",
    "News & Reading": "📰",
    "Learning": "📚",
    "Health": "💪",
    "Other": "📊",
  };
  return icons[category] ?? "📊";
}
