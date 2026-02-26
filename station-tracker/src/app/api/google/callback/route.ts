import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getSetting, setSetting } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/callback
 * OAuth callback handler. Receives `code` query param, exchanges for tokens,
 * stores refresh_token in settings, then redirects to /admin/sheets.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      const redirectUrl = new URL("/admin/sheets", request.url);
      redirectUrl.searchParams.set("auth_error", error);
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!code) {
      const redirectUrl = new URL("/admin/sheets", request.url);
      redirectUrl.searchParams.set("auth_error", "No authorization code received");
      return NextResponse.redirect(redirectUrl.toString());
    }

    const clientId = await getSetting("google_client_id");
    const clientSecret = await getSetting("google_client_secret");

    if (!clientId || !clientSecret) {
      const redirectUrl = new URL("/admin/sheets", request.url);
      redirectUrl.searchParams.set("auth_error", "Google API credentials not configured");
      return NextResponse.redirect(redirectUrl.toString());
    }

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      await setSetting("google_refresh_token", tokens.refresh_token);
    }

    const redirectUrl = new URL("/admin/sheets", request.url);
    redirectUrl.searchParams.set("auth_success", "true");
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("[GET /api/google/callback]", err);
    const redirectUrl = new URL("/admin/sheets", request.url);
    redirectUrl.searchParams.set(
      "auth_error",
      err instanceof Error ? err.message : "Failed to exchange authorization code"
    );
    return NextResponse.redirect(redirectUrl.toString());
  }
}
