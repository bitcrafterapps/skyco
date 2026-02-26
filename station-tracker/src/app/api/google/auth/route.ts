import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getSetting, deleteSetting } from "@/lib/queries";
import dotenv from 'dotenv';

dotenv.config();

export const dynamic = "force-dynamic";

/**
 * GET /api/google/auth
 * Initiate OAuth flow -- generate Google OAuth URL and return it.
 * Requires google_client_id and google_client_secret to be set in settings.
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          data: null,
          error:
            "Google API credentials not configured. Please set Client ID and Client Secret first.",
        },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const redirectUri = `${origin}/api/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    return NextResponse.json({ data: { url } });
  } catch (err) {
    console.error("[GET /api/google/auth]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/google/auth
 * Disconnect from Google by removing the refresh token.
 */
export async function DELETE() {
  try {
    deleteSetting("google_refresh_token");
    return NextResponse.json({ data: { disconnected: true } });
  } catch (err) {
    console.error("[DELETE /api/google/auth]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
