import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { plaidClient } from "@/lib/plaid";

// POST /api/plaid/exchange  { public_token: string }
// Exchanges the Plaid public token for an access token and saves it
export async function POST(req: NextRequest) {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { public_token } = await req.json();
  if (!public_token) return NextResponse.json({ error: "public_token required" }, { status: 400 });

  const { data: exchangeData } = await plaidClient.itemPublicTokenExchange({ public_token });
  const access_token = exchangeData.access_token;
  const item_id      = exchangeData.item_id;

  // Store encrypted access token in profile
  await supabase.from("profiles").update({
    plaid_access_token: access_token,
    plaid_item_id:      item_id,
  } as never).eq("id", user.id);

  return NextResponse.json({ success: true });
}
