import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { getOAuthClient } from "@/lib/google";

// GET /api/calendar/callback?code=...&state=user_id
// Google redirects here after user grants calendar access
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code   = searchParams.get("code");
  const userId = searchParams.get("state"); // we passed user.id as state
  const error  = searchParams.get("error");

  if (error || !code || !userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=denied`
    );
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    const supabase = createApiClient();
    await supabase
      .from("profiles")
      .update({
        google_access_token:  tokens.access_token,
        google_refresh_token: tokens.refresh_token,
      } as never)
      .eq("id", userId);

    // Immediately trigger a sync
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return NextResponse.redirect(`${appUrl}/settings?calendar=connected`);
  } catch (err) {
    console.error("Calendar callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`
    );
  }
}
