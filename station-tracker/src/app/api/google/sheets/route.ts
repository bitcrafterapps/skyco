
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getSetting, setSetting } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { STATIONS } from "@/lib/types";
import type { StationId } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getAuthenticatedSheetsClient() {
  const clientId = await getSetting("google_client_id");
  const clientSecret = await getSetting("google_client_secret");
  const refreshToken = await getSetting("google_refresh_token");

  if (!clientId || !clientSecret) {
    throw new Error("Google API credentials not configured");
  }
  if (!refreshToken) {
    throw new Error("Not authenticated with Google. Please connect your Google account first.");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.sheets({ version: "v4", auth: oauth2Client });
}

/**
 * GET /api/google/sheets
 * Test the connection -- read the first row of the configured sheet.
 * Returns sheet title, column headers, and row count.
 */
export async function GET() {
  try {
    const sheetId = await getSetting("google_sheet_id");
    const sheetName = (await getSetting("google_sheet_name")) || "Sheet1";

    if (!sheetId) {
      return NextResponse.json(
        { data: null, error: "Google Sheet ID not configured" },
        { status: 400 }
      );
    }

    const sheets = await getAuthenticatedSheetsClient();

    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const title = spreadsheet.data.properties?.title || "Unknown";

    // Read all data to get headers and row count
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
    });

    const rows = response.data.values || [];
    const headers = rows.length > 0 ? rows[0] : [];
    const rowCount = Math.max(0, rows.length - 1); // Exclude header row

    return NextResponse.json({
      data: {
        title,
        sheetName,
        headers,
        columnCount: headers.length,
        rowCount,
      },
    });
  } catch (err) {
    console.error("[GET /api/google/sheets]", err);
    const message = err instanceof Error ? err.message : "Failed to connect to Google Sheets";
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/google/sheets
 * Trigger a sync -- read all rows and upsert orders into the database.
 */
export async function POST() {
  try {
    const sheetId = await getSetting("google_sheet_id");
    const sheetName = (await getSetting("google_sheet_name")) || "Sheet1";

    if (!sheetId) {
      return NextResponse.json(
        { data: null, error: "Google Sheet ID not configured" },
        { status: 400 }
      );
    }

    const sheets = await getAuthenticatedSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      return NextResponse.json({
        data: {
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: 0,
          errorDetails: [],
          message: "No data rows found in the sheet (only header or empty)",
        },
      });
    }

    // Map header names to column indices (case-insensitive, trimmed)
    const rawHeaders = rows[0].map((h: string) =>
      String(h).trim().toLowerCase().replace(/\s+/g, "_")
    );

    const colMap: Record<string, number> = {};
    for (let i = 0; i < rawHeaders.length; i++) {
      colMap[rawHeaders[i]] = i;
    }

    // Required: order_number
    if (colMap["order_number"] === undefined) {
      return NextResponse.json(
        {
          data: null,
          error: `Header "order_number" not found. Found headers: ${rawHeaders.join(", ")}`,
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    const getCellValue = (row: string[], columnName: string): string => {
      const idx = colMap[columnName];
      if (idx === undefined || idx >= row.length) return "";
      return String(row[idx]).trim();
    };

    const dataRows = rows.slice(1);

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2; // 1-indexed, accounting for header row

        try {
          const orderNumber = getCellValue(row, "order_number");
          if (!orderNumber) {
            skipped++;
            continue;
          }

          const customerName = getCellValue(row, "customer_name");
          const department = getCellValue(row, "department");
          const station = getCellValue(row, "station");
          const status = getCellValue(row, "status");
          const isRushStr = getCellValue(row, "is_rush");
          const shipDate = getCellValue(row, "ship_date");
          const sidemark = getCellValue(row, "sidemark");
          const notes = getCellValue(row, "notes");

          // Parse is_rush: accept "1", "true", "yes", "rush" (case-insensitive)
          const isRush = ["1", "true", "yes", "rush"].includes(isRushStr.toLowerCase());

          // Validate station if provided
          let validStation = "basket";
          if (station && STATIONS.includes(station as StationId)) {
            validStation = station;
          }

          // Check if order already exists
          const existing = await tx.order.findUnique({
            where: { orderNumber },
          });

          if (existing) {
            // Update existing order
            await tx.order.update({
              where: { id: existing.id },
              data: {
                customerName: customerName || undefined,
                department,
                currentStation: validStation,
                status: status || "Producible",
                isRush,
                shipDate: shipDate || null,
                sidemark,
                notes,
              },
            });
            updated++;
          } else {
            // Insert new order
            const newOrder = await tx.order.create({
              data: {
                orderNumber,
                customerName,
                department,
                currentStation: validStation,
                status: status || "Producible",
                isRush,
                shipDate: shipDate || null,
                sidemark,
                notes,
              },
            });

            // Create station status rows for every station
            await tx.orderStationStatus.createMany({
               data: STATIONS.map(s => ({
                   orderId: newOrder.id,
                   station: s,
               }))
            });

            imported++;
          }
        } catch (rowErr) {
          errors++;
          errorDetails.push(
            `Row ${rowNum}: ${rowErr instanceof Error ? rowErr.message : "Unknown error"}`
          );
        }
      }
    });

    // Record sync timestamp
    await setSetting("google_last_sync", new Date().toISOString());

    return NextResponse.json({
      data: {
        imported,
        updated,
        skipped,
        errors,
        errorDetails: errorDetails.slice(0, 20), // Limit error details
        message: `Sync complete: ${imported} imported, ${updated} updated, ${skipped} skipped, ${errors} errors`,
      },
    });
  } catch (err) {
    console.error("[POST /api/google/sheets]", err);
    const message = err instanceof Error ? err.message : "Failed to sync from Google Sheets";
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
