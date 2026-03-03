import { NextRequest, NextResponse } from "next/server";
import { getSettings, setSetting } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ALLOWED_UPDATE_KEYS = [
  "google_client_id",
  "google_client_secret",
  "google_sheet_id",
  "google_sheet_name",
  "default_view_preference",
  "done_advance_delay_minutes",
];

const MASKED_KEYS = ["google_client_secret", "google_refresh_token"];

function maskValue(value: string): string {
  if (value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

/**
 * GET /api/settings
 * Returns settings with sensitive values masked.
 * Optional query param: ?prefix=google_ to filter keys.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || undefined;
    const settings = await getSettings(prefix);
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (MASKED_KEYS.includes(key)) {
        masked[key] = maskValue(value);
      } else {
        masked[key] = value;
      }
    }
    return NextResponse.json({ data: masked });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update a single setting. Body: { key: string, value: string }
 * Only allows updating specific google_* keys.
 */
export async function PUT(request: NextRequest) {
  try {
    let body: { key?: string; value?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body.key || typeof body.key !== "string") {
      return NextResponse.json(
        { data: null, error: "key is required and must be a string" },
        { status: 400 }
      );
    }
    if (body.value === undefined || typeof body.value !== "string") {
      return NextResponse.json(
        { data: null, error: "value is required and must be a string" },
        { status: 400 }
      );
    }

    if (!ALLOWED_UPDATE_KEYS.includes(body.key)) {
      return NextResponse.json(
        {
          data: null,
          error: `Cannot update key: ${body.key}. Allowed keys: ${ALLOWED_UPDATE_KEYS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    await setSetting(body.key, body.value);
    return NextResponse.json({ data: { key: body.key, updated: true } });
  } catch (err) {
    console.error("[PUT /api/settings]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
