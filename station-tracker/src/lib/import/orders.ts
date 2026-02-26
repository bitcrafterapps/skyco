import { prisma } from "@/lib/db";
import type { ImportOrderDraft, PreviewResponse } from "@/lib/import/types";

type CsvParseResult = {
  headers: string[];
  records: string[][];
};

export async function buildPreviewFromCsv(
  csvText: string,
  fileName: string
): Promise<PreviewResponse> {
  const parsed = parseCsv(csvText);
  const stations = await prisma.station.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const stationOptions = stations.map((station) => ({
    id: station.id,
    label: station.label,
  }));
  const stationLookup = buildStationLookup(stationOptions);

  const rows: ImportOrderDraft[] = [];
  for (const [index, record] of parsed.records.entries()) {
    const draft = mapRecordToDraft(index + 2, parsed.headers, record, stationLookup);
    if (draft) rows.push(draft);
  }

  const uniqueOrderNumbers = Array.from(
    new Set(rows.map((row) => row.orderNumber).filter(Boolean))
  );

  if (uniqueOrderNumbers.length > 0) {
    const existing = await prisma.order.findMany({
      where: { orderNumber: { in: uniqueOrderNumbers } },
      select: { orderNumber: true },
    });
    const existingSet = new Set(existing.map((item) => item.orderNumber));
    for (const row of rows) {
      if (existingSet.has(row.orderNumber) && row.importAction !== "skip") {
        row.importAction = "update";
        row.warnings.push("Order number already exists in DB. Action set to update.");
      }
    }
  }

  const validRows = rows.filter((row) => row.errors.length === 0).length;
  const invalidRows = rows.length - validRows;

  return {
    fileName,
    totalRows: parsed.records.length,
    parsedRows: rows.length,
    validRows,
    invalidRows,
    stationOptions,
    rows,
  };
}

export function parseCsv(csvText: string): CsvParseResult {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        currentField += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      currentRow.push(currentField);
      currentField = "";

      if (currentRow.some((cell) => cell.trim() !== "")) {
        rows.push(currentRow.map((cell) => cell.trim()));
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((cell) => cell.trim() !== "")) {
      rows.push(currentRow.map((cell) => cell.trim()));
    }
  }

  const [headerRow = [], ...records] = rows;
  return { headers: headerRow, records };
}

function mapRecordToDraft(
  rowNumber: number,
  headers: string[],
  record: string[],
  stationLookup: Map<string, string>
): ImportOrderDraft | null {
  const orderNumberRaw = getCol(headers, record, "Order Number");
  const customerNameRaw = getCol(headers, record, "Customer Name");

  const orderNumber = sanitizeOrderNumber(orderNumberRaw);
  const customerName = customerNameRaw.trim();

  // Ignore summary/non-order rows.
  if (!orderNumber) return null;
  if (!customerName || customerName === "#N/A") return null;

  const locationRaw = getCol(headers, record, "Location");
  const mappedStation = mapStation(locationRaw, stationLookup);
  const department = cleanString(getCol(headers, record, "Department"), "Roller Shade");
  const status = cleanString(getCol(headers, record, "Status"), "Producible");
  const shipDate = normalizeDate(getCol(headers, record, "Ship Date"));
  const saleAmount = parseMoney(getCol(headers, record, "Sale Amount"));
  const sidemark = cleanString(getCol(headers, record, "Sidemark"), "");
  const notes = cleanString(getCol(headers, record, "Notes"), "");
  const target = cleanString(getCol(headers, record, "Target"), "");
  const markedStatus = getCol(headers, record, "Marked Status");
  const isRush =
    /\brush\b/i.test(notes) ||
    /\bmust ship\b/i.test(target) ||
    /\brush\b/i.test(sidemark) ||
    markedStatus.trim() === "x";

  const warnings: string[] = [];
  const errors: string[] = [];
  if (!mappedStation) {
    errors.push(`Station "${locationRaw}" is not mapped to an active station.`);
  }
  if (!shipDate && getCol(headers, record, "Ship Date").trim()) {
    warnings.push("Ship Date could not be normalized; value set to blank.");
  }
  if (!status) {
    warnings.push("Missing status; defaulting to Producible.");
  }

  return {
    rowNumber,
    orderNumber,
    customerName,
    department,
    currentStation: mappedStation ?? "",
    status: status || "Producible",
    shipDate,
    saleAmount,
    sidemark,
    notes,
    target,
    isRush,
    importAction: "create",
    selected: errors.length === 0,
    warnings,
    errors,
  };
}

function getCol(headers: string[], record: string[], name: string): string {
  const idx = headers.findIndex((header) => header.trim().toLowerCase() === name.toLowerCase());
  if (idx < 0) return "";
  return record[idx] ?? "";
}

function sanitizeOrderNumber(raw: string): string {
  const value = raw.trim();
  if (!/^\d+$/.test(value)) return "";
  return value;
}

function cleanString(raw: string, fallback: string): string {
  const value = raw.trim();
  if (!value || value === "#N/A") return fallback;
  return value;
}

function normalizeDate(raw: string): string | null {
  const value = raw.trim();
  if (!value || value === "#N/A") return null;

  // Supports m/d/yy and m/d/yyyy
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const iso = `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  return iso;
}

function parseMoney(raw: string): number {
  const cleaned = raw.replaceAll(",", "").replaceAll("$", "").trim();
  if (!cleaned || cleaned === "#N/A") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildStationLookup(
  options: Array<{ id: string; label: string }>
): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const option of options) {
    const keys = new Set([
      normalizeStationToken(option.id),
      normalizeStationToken(option.label),
    ]);
    for (const key of keys) {
      if (key) lookup.set(key, option.id);
    }
  }
  return lookup;
}

function mapStation(
  locationRaw: string,
  stationLookup: Map<string, string>
): string | null {
  const key = normalizeStationToken(locationRaw);
  if (!key) return null;
  return stationLookup.get(key) ?? null;
}

function normalizeStationToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "");
}
