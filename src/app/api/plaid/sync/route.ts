import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { plaidClient, classifyTransaction } from "@/lib/plaid";
import { RemovedTransaction, Transaction } from "plaid";
import { startOfWeek, endOfWeek, format } from "date-fns";

// POST /api/plaid/sync
// Fetches this week's transactions from Plaid, classifies them, upserts to expenses
export async function POST(_req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get access token from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("plaid_access_token")
    .eq("id", user.id)
    .single();

  if (!profile?.plaid_access_token) {
    return NextResponse.json({ error: "No bank account connected" }, { status: 400 });
  }

  const access_token = profile.plaid_access_token as string;

  // Date range: current week (Mon–Sun)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(now,   { weekStartsOn: 1 });
  const startDate = format(weekStart, "yyyy-MM-dd");
  const endDate   = format(weekEnd,   "yyyy-MM-dd");

  // Fetch transactions from Plaid
  let transactions: Transaction[] = [];
  let removedTransactions: RemovedTransaction[] = [];
  let cursor: string | undefined;

  // Use transactions sync API (preferred over get for incremental updates)
  let hasMore = true;
  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token,
      cursor,
      options: { include_personal_finance_category: true },
    });
    const data = response.data;
    transactions          = [...transactions, ...data.added, ...data.modified];
    removedTransactions   = [...removedTransactions, ...data.removed];
    hasMore = data.has_more;
    cursor  = data.next_cursor;
  }

  // Filter to current week only
  transactions = transactions.filter(
    (t) => t.date >= startDate && t.date <= endDate && !t.pending
  );

  // Remove old bank-sourced expenses for this week (clean re-sync)
  await supabase
    .from("expenses")
    .delete()
    .eq("user_id", user.id)
    .eq("source", "bank")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate);

  // Handle removed transactions (from sync API)
  if (removedTransactions.length > 0) {
    const removedIds = removedTransactions.map((r) => r.transaction_id);
    await supabase
      .from("expenses")
      .delete()
      .eq("user_id", user.id)
      .in("note", removedIds); // we store transaction_id in note field
  }

  if (transactions.length === 0) {
    return NextResponse.json({ synced: 0, message: "No transactions found for this week" });
  }

  // Build expense rows
  const rows = transactions
    .filter((t) => t.amount > 0) // positive = money out in Plaid
    .map((t) => {
      const categories: string[] = t.personal_finance_category
        ? [t.personal_finance_category.primary, t.personal_finance_category.detailed]
        : (t.category ?? []);

      const bucket = classifyTransaction(categories, t.merchant_name ?? t.name);

      return {
        user_id:    user.id,
        label:      t.merchant_name ?? t.name,
        bucket,
        amount:     Math.abs(t.amount),
        currency:   t.iso_currency_code ?? "INR",
        entry_date: t.date,
        note:       t.transaction_id, // store for dedup / removal
        source:     "bank" as const,
      };
    });

  if (rows.length > 0) {
    await (supabase.from("expenses") as never as {
      insert: (data: typeof rows) => Promise<{ error: unknown }>
    }).insert(rows);
  }

  return NextResponse.json({ synced: rows.length });
}
