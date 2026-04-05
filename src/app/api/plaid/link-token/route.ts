import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRIES } from "@/lib/plaid";

// POST /api/plaid/link-token
// Creates a Plaid Link token to initialise the bank connection UI
export async function POST() {
  const supabase = createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: "Life Audit",
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRIES,
    language: "en",
  });

  return NextResponse.json({ link_token: response.data.link_token });
}
