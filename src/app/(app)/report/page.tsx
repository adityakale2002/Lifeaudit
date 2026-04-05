"use client";
import { useState, useEffect } from "react";

interface SavedReport {
  id: string;
  period_start: string;
  period_end: string;
  alignment_score: number | null;
  report_content: string | null;
  created_at: string;
  report_type: string;
}

// Renders markdown-ish report content with styled headings
function ReportContent({ content }: { content: string }) {
  const sections = content.split(/\n## /).filter(Boolean);
  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        const [heading, ...rest] = section.split("\n");
        const body = rest.join("\n").trim();
        return (
          <div key={i}>
            {i > 0 && <h3 className="text-[17px] font-black text-[#F0F5F1] mb-2">{heading.replace(/^## /, "")}</h3>}
            {i === 0 && <h3 className="text-[17px] font-black text-[#F0F5F1] mb-2">{heading}</h3>}
            <div className="text-[15px] text-[#6B7F70] leading-[1.85] whitespace-pre-line">{body}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportPage() {
  const [reports, setReports]     = useState<SavedReport[]>([]);
  const [selected, setSelected]   = useState<SavedReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    setLoading(true);
    const res = await fetch("/api/report");
    const json = await res.json();
    const list: SavedReport[] = json.reports ?? [];
    setReports(list);
    if (list.length > 0) setSelected(list[0]);
    setLoading(false);
  }

  async function generateReport() {
    setGenerating(true);
    setGenError(null);
    const res  = await fetch("/api/report", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setGenError(json.error ?? "Something went wrong. Make sure your ANTHROPIC_API_KEY is set.");
    } else {
      await loadReports();
    }
    setGenerating(false);
  }

  function formatPeriod(start: string, end: string) {
    const s = new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const e = new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
  }

  return (
    <div className="fade-up px-9 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-black text-[#F0F5F1]">Your Audit Reports</h1>
          <p className="text-sm text-[#3A4A3E] mt-1">AI-generated weekly deep-dives, powered by Claude</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="text-sm font-bold px-5 py-2.5 rounded-xl bg-[#2DD4BF] text-[#080C0A] hover:bg-[#5EEAD4] transition-all disabled:opacity-60 flex items-center gap-2"
        >
          {generating ? (
            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Generating…</>
          ) : (
            "✨ Generate This Week's Report"
          )}
        </button>
      </div>

      {genError && (
        <div className="bg-[#F87171]/8 border border-[#F87171]/15 text-[#F87171] text-sm px-5 py-4 rounded-xl mb-6">
          {genError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#3A4A3E] text-sm">Loading reports…</div>
      ) : reports.length === 0 ? (
        /* Empty state */
        <div className="bg-[#0F1510] rounded-xl border border-[#1C2620] p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-black text-[#F0F5F1] mb-2">No reports yet</h2>
          <p className="text-sm text-[#3A4A3E] max-w-sm mx-auto mb-6 leading-relaxed">
            Log at least a few time entries or expenses, then generate your first AI Audit Report above. It takes about 10 seconds.
          </p>
          <a href="/entry" className="inline-block text-sm font-bold px-5 py-2.5 rounded-xl bg-[#141C15] text-[#F0F5F1] hover:bg-[#1C2620] transition-all">
            → Go log your first entries
          </a>
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Report list sidebar */}
          {reports.length > 1 && (
            <div className="w-52 flex-shrink-0 space-y-2">
              <div className="text-[11px] font-semibold text-[#3A4A3E] uppercase tracking-wider mb-3">Past Reports</div>
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selected?.id === r.id
                      ? "border-[#2DD4BF]/30 bg-[#2DD4BF]/8 text-[#2DD4BF]"
                      : "border-[#1C2620] bg-[#0F1510] text-[#6B7F70] hover:border-[#1C2620]"
                  }`}
                >
                  <div className="text-xs font-bold capitalize mb-0.5">{r.report_type}</div>
                  <div className="text-xs text-[#3A4A3E]">{formatPeriod(r.period_start, r.period_end)}</div>
                  {r.alignment_score && (
                    <div className="text-xs font-semibold mt-1 text-[#818CF8]">{r.alignment_score}% aligned</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Report content */}
          {selected && (
            <div className="flex-1 bg-[#0F1510] rounded-xl border border-[#1C2620] overflow-hidden shadow-sm">
              {/* Report header */}
              <div className="bg-[#0F1510] border-b border-[#1C2620] px-8 py-7">
                <div className="text-[11px] uppercase tracking-[2px] text-[#3A4A3E] mb-2">
                  {selected.report_type} Life Audit
                </div>
                <div className="text-xl font-black mb-2">
                  {formatPeriod(selected.period_start, selected.period_end)}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {selected.alignment_score !== null && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-[#818CF8] flex items-center justify-center text-xs font-black text-[#818CF8]">
                        {selected.alignment_score}
                      </div>
                      <span className="text-sm text-[#6B7F70]">Alignment score</span>
                    </div>
                  )}
                  <span className="text-xs text-[#3A4A3E]">
                    Generated {new Date(selected.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Report body */}
              <div className="px-8 py-7">
                {selected.report_content ? (
                  <ReportContent content={selected.report_content} />
                ) : (
                  <p className="text-[#3A4A3E] text-sm">No content available for this report.</p>
                )}
                <div className="mt-8 pt-6 border-t border-[#1C2620] flex items-center justify-between">
                  <p className="text-xs text-[#3A4A3E] italic">
                    This report was generated by Claude based on your logged data. It is a mirror, not a verdict.
                  </p>
                  <button
                    onClick={() => window.print()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#1C2620] text-[#6B7F70] hover:border-[#243028] transition-all"
                  >
                    Print / Save PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
