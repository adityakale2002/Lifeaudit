import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createApiClient } from "@/lib/supabase/server";
import { getOAuthClient, getAuthUrl, classifyEvent, eventDurationHours } from "@/lib/google";

// GET /api/calendar — returns auth URL or synced events
export async function GET(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = new URL(req.url).searchParams.get("action");

  // Return Google OAuth URL
  if (action === "auth-url") {
    const url = getAuthUrl(user.id);
    return NextResponse.json({ url });
  }

  // Sync calendar events for this week
  if (action === "sync") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_access_token, google_refresh_token")
      .eq("id", user.id)
      .single();

    const p = profile as Record<string, string> | null;

    if (!p?.google_access_token) {
      return NextResponse.json({ error: "Google Calendar not connected", needsAuth: true }, { status: 401 });
    }

    const client = getOAuthClient();
    client.setCredentials({
      access_token:  p.google_access_token,
      refresh_token: p.google_refresh_token,
    });

    // Auto-refresh token if needed
    client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        await supabase.from("profiles").update({
          google_access_token:  tokens.access_token,
          google_refresh_token: tokens.refresh_token ?? p.google_refresh_token,
        } as never).eq("id", user.id);
      }
    });

    const calendar   = google.calendar({ version: "v3", auth: client });
    const now        = new Date();
    const weekStart  = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0, 0, 0, 0);
    const weekEnd    = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);

    const { data: events } = await calendar.events.list({
      calendarId: "primary",
      timeMin: weekStart.toISOString(),
      timeMax: weekEnd.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 200,
    });

    const items = events.items ?? [];

    // Convert events → time entries and upsert
    const entries = items
      .filter((e) => e.start?.dateTime && e.end?.dateTime && e.summary)
      .map((e) => ({
        user_id:    user.id,
        label:      e.summary!,
        bucket:     classifyEvent(e.summary!, e.description ?? ""),
        hours:      eventDurationHours(e.start!.dateTime!, e.end!.dateTime!),
        entry_date: e.start!.dateTime!.split("T")[0],
        note:       e.description ?? null,
        source:     "calendar" as const,
      }))
      .filter((e) => e.hours > 0);

    if (entries.length > 0) {
      // Delete existing calendar entries for this week, then re-insert
      await supabase
        .from("time_entries")
        .delete()
        .eq("user_id", user.id)
        .eq("source", "calendar")
        .gte("entry_date", weekStart.toISOString().split("T")[0])
        .lte("entry_date", weekEnd.toISOString().split("T")[0]);

      await supabase.from("time_entries").insert(entries as never);
    }

    return NextResponse.json({ synced: entries.length, entries });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
