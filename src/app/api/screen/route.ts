import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  let query = supabase
    .from("screen_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  if (from) query = query.gte("entry_date", from);
  if (to)   query = query.lte("entry_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { app_name, category, hours, entry_date } = body;

  if (!app_name || !category || !hours) {
    return NextResponse.json({ error: "app_name, category, and hours are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("screen_entries")
    .insert({
      user_id: user.id,
      app_name,
      category,
      hours: parseFloat(hours),
      entry_date: entry_date ?? new Date().toISOString().split("T")[0],
      source: "manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("screen_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
