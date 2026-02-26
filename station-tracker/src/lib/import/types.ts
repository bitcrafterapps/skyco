export type ImportOrderDraft = {
  rowNumber: number;
  orderNumber: string;
  customerName: string;
  department: string;
  currentStation: string;
  status: string;
  shipDate: string | null;
  saleAmount: number;
  sidemark: string;
  notes: string;
  target: string;
  isRush: boolean;
  importAction: "create" | "update" | "skip";
  selected: boolean;
  warnings: string[];
  errors: string[];
};

export type PreviewResponse = {
  fileName: string;
  totalRows: number;
  parsedRows: number;
  validRows: number;
  invalidRows: number;
  stationOptions: Array<{ id: string; label: string }>;
  rows: ImportOrderDraft[];
};

export type ImportJobStatus = "queued" | "running" | "completed" | "failed";

export type ImportJob = {
  id: string;
  status: ImportJobStatus;
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  message: string;
  startedAt: string;
  finishedAt: string | null;
  errors: string[];
};
