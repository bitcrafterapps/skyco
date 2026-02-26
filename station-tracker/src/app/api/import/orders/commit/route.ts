import { NextRequest, NextResponse } from "next/server";
import { processImportRows } from "@/lib/import/orderImportJobs";
import type { ImportOrderDraft } from "@/lib/import/types";

export const dynamic = "force-dynamic";

type CommitBody = {
  rows?: ImportOrderDraft[];
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CommitBody;
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      return NextResponse.json(
        { data: null, error: "No rows supplied for import." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: await processImportRows(rows),
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/import/orders/commit]", err);
    return NextResponse.json(
      { data: null, error: "Failed to start import job." },
      { status: 500 }
    );
  }
}
