import { NextRequest, NextResponse } from "next/server";
import { buildPreviewFromCsv } from "@/lib/import/orders";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { data: null, error: "CSV file is required." },
        { status: 400 }
      );
    }

    const fileName = file.name || "import.csv";
    if (!fileName.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { data: null, error: "Only .csv files are supported." },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    if (!csvText.trim()) {
      return NextResponse.json(
        { data: null, error: "Uploaded CSV is empty." },
        { status: 400 }
      );
    }

    const preview = await buildPreviewFromCsv(csvText, fileName);
    return NextResponse.json({ data: preview, error: null });
  } catch (err) {
    console.error("[POST /api/import/orders/preview]", err);
    return NextResponse.json(
      { data: null, error: "Failed to parse CSV for preview." },
      { status: 500 }
    );
  }
}
