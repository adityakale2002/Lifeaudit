import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createApiClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const BUCKET_LABELS: Record<string, string> = {
  work: "Work", family: "Family & Relationships", health: "Health & Fitness",
  growth: "Learning & Growth", leisure: "Leisure & Fun", admin: "Admin & Errands", sleep: "Sleep",
};

// POST /api/report — generate an AI audit report from this week's data
export async function POST(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load profile + priorities
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, priorities")
    .eq("id", user.id)
    .single();

  const firstName  = (profile as { full_name: string | null } | null)?.full_name?.split(" ")[0] ?? "there";
  const priorities = (profile as { priorities: string[] | null } | null)?.priorities ?? ["family","work","health","growth","leisure","admin"];

  // Load this week's data
  const now       = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const from      = weekStart.toISOString().split("T")[0];
  const to        = weekEnd.toISOString().split("T")[0];

  const [{ data: timeEntries }, { data: expenses }] = await Promise.all([
    supabase.from("time_entries").select("*").eq("user_id", user.id).gte("entry_date", from).lte("entry_date", to),
    supabase.from("expenses").select("*").eq("user_id", user.id).gte("entry_date", from).lte("entry_date", to),
  ]);

  // Aggregate totals by bucket
  const timeTotals: Record<string, number> = {};
  (timeEntries ?? []).forEach((e: { bucket: string; hours: number }) => {
    timeTotals[e.bucket] = (timeTotals[e.bucket] ?? 0) + Number(e.hours);
  });

  const expTotals: Record<string, number> = {};
  (expenses ?? []).forEach((e: { bucket: string; amount: number }) => {
    expTotals[e.bucket] = (expTotals[e.bucket] ?? 0) + Number(e.amount);
  });

  const totalHours = Object.values(timeTotals).reduce((s, v) => s + v, 0);
  const totalSpend = Object.values(expTotals).reduce((s, v) => s + v, 0);

  // Build alignment data
  const timeBreakdown = Object.entries(timeTotals)
    .map(([b, h]) => `${BUCKET_LABELS[b] ?? b}: ${h.toFixed(1)}h (${totalHours > 0 ? Math.round((h / totalHours) * 100) : 0}%)`)
    .join("\n  ");

  const spendBreakdown = Object.entries(expTotals)
    .map(([b, v]) => `${BUCKET_LABELS[b] ?? b}: ₹${v.toFixed(2)}`)
    .join("\n  ");

  const statedPriorities = priorities
    .map((p: string, i: number) => `${i + 1}. ${BUCKET_LABELS[p] ?? p}`)
    .join("\n  ");

  const topPriority   = priorities[0];
  const topHours      = timeTotals[topPriority] ?? 0;
  const topPct        = totalHours > 0 ? Math.round((topHours / totalHours) * 100) : 0;
  const workHours     = timeTotals["work"] ?? 0;
  const workPct       = totalHours > 0 ? Math.round((workHours / totalHours) * 100) : 0;
  const alignScore    = Math.min(100, Math.max(0, 100 - Math.abs(35 - topPct) * 2));

  // Prompt for Claude
  const prompt = `You are writing a weekly Life Audit report for ${firstName}. Your tone is that of a brilliant, compassionate coach — warm, honest, and insightful. You surface patterns they might not have noticed, without being preachy. You use data to tell a story, not just list numbers.

Here is ${firstName}'s data for the week of ${from} to ${to}:

STATED PRIORITIES (what they say matters most):
  ${statedPriorities}

TIME BREAKDOWN (what their calendar/log shows):
  ${timeBreakdown || "No time entries logged this week."}
  Total tracked: ${totalHours.toFixed(1)} hours

SPENDING BREAKDOWN (what their money shows):
  ${spendBreakdown || "No expenses logged this week."}
  Total: ₹${totalSpend.toFixed(2)}

KEY STATS:
  - Top stated priority (${BUCKET_LABELS[topPriority] ?? topPriority}): ${topPct}% of tracked time
  - Work: ${workPct}% of tracked time
  - Alignment score: ${Math.round(alignScore)}%

Write a Life Audit report with the following structure (use these exact headings):

## The Story of Your Week

A 2-3 paragraph narrative that reads like a thoughtful letter. Reference specific numbers but make them feel human. Surface the most important insight — usually the gap between stated priorities and actual behaviour. Be specific, be kind, be honest.

## What Your Money Is Saying

1-2 paragraphs on the spending data. What does it reveal about their actual values vs stated ones? Any patterns worth noting?

## Your Attention (if relevant)

1 short paragraph on what the data implies about where their mental energy and focus went this week, even if screen time data isn't available.

## Three Things to Try Next Week

Three specific, actionable recommendations that are directly tied to their data. Not generic advice — personalised to ${firstName}'s numbers. Each recommendation should be one sentence of what to do, followed by one sentence of why (tied to their specific data).

## Closing

One powerful sentence. A mirror, not a verdict.

Keep the entire report under 600 words. Write in second person ("you", "your"). No bullet points in the narrative sections. Be the coach ${firstName} wishes they had.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const reportContent = completion.choices[0]?.message?.content ?? "";

  // Save report to DB
  const { data: saved } = await supabase
    .from("audit_reports")
    .insert({
      user_id:         user.id,
      report_type:     "weekly",
      period_start:    from,
      period_end:      to,
      alignment_score: Math.round(alignScore),
      report_content:  reportContent,
      insights: {
        total_hours: totalHours,
        total_spend: totalSpend,
        time_totals: timeTotals,
        exp_totals:  expTotals,
        top_priority: topPriority,
        top_pct:      topPct,
        work_pct:     workPct,
      },
    } as never)
    .select()
    .single();

  return NextResponse.json({
    report: reportContent,
    alignment_score: Math.round(alignScore),
    period: { from, to },
    saved,
  });
}

// GET /api/report — load most recent saved report
export async function GET() {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("audit_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({ reports: data ?? [] });
}
