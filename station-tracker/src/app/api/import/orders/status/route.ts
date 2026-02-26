import { NextRequest, NextResponse } from "next/server";
import { getImportJob } from "@/lib/import/orderImportJobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json(
        { data: null, error: "jobId is required" },
        { status: 400 }
      );
    }

    const job = getImportJob(jobId);
    if (!job) {
      return NextResponse.json(
        { data: null, error: "Import job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: job, error: null });
  } catch (err) {
    console.error("[GET /api/import/orders/status]", err);
    return NextResponse.json(
      { data: null, error: "Failed to load import status" },
      { status: 500 }
    );
  }
}
