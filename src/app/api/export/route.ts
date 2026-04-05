import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// GET /api/export?format=json|csv
// Exports all user data
export async function GET(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  // Fetch all user data
  const [profile, timeEntries, expenses, screenEntries, reports] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("time_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }),
    supabase.from("expenses").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }),
    supabase.from("screen_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }),
    supabase.from("audit_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const exportData = {
    profile: profile.data,
    time_entries: timeEntries.data ?? [],
    expenses: expenses.data ?? [],
    screen_entries: screenEntries.data ?? [],
    audit_reports: reports.data ?? [],
    exported_at: new Date().toISOString(),
  };

  if (format === "csv") {
    // Convert to CSV (simplified - just time and expenses)
    const csvRows: string[] = [];
    
    // Time entries CSV
    csvRows.push("TYPE,DATE,LABEL,BUCKET,VALUE,NOTE,SOURCE");
    (timeEntries.data ?? []).forEach((entry: Record<string, unknown>) => {
      csvRows.push(`Time,${entry.entry_date},${entry.label},${entry.bucket},${entry.hours}h,"${entry.note ?? ''}",${entry.source}`);
    });
    
    // Expenses CSV
    (expenses.data ?? []).forEach((expense: Record<string, unknown>) => {
      csvRows.push(`Expense,${expense.entry_date},${expense.label},${expense.bucket},₹${expense.amount},"${expense.note ?? ''}",${expense.source}`);
    });

    const csv = csvRows.join("\n");
    
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="lifeaudit-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  // JSON format
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lifeaudit-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}
