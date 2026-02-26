"use client";

import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ImportJob, ImportOrderDraft, PreviewResponse } from "@/lib/import/types";

type OrderImportPanelProps = {
  onImportComplete?: (message: string) => void;
};

export default function OrderImportPanel({ onImportComplete }: OrderImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [rows, setRows] = useState<ImportOrderDraft[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [job, setJob] = useState<ImportJob | null>(null);
  const [startingImport, setStartingImport] = useState(false);

  const selectedValidRows = useMemo(
    () => rows.filter((row) => row.selected && row.errors.length === 0),
    [rows]
  );

  const allSelectableChecked = useMemo(() => {
    const selectable = rows.filter((row) => row.errors.length === 0);
    if (selectable.length === 0) return false;
    return selectable.every((row) => row.selected);
  }, [rows]);

  const progressPercent = useMemo(() => {
    if (!job) return 0;
    const raw = Math.min(100, Math.round((job.processed / Math.max(1, job.total)) * 100));
    if (job.processed > 0 && raw === 0) return 1;
    return raw;
  }, [job]);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/import/orders/preview", {
        method: "POST",
        body: formData,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error ?? `HTTP ${res.status}`);
      }
      const data = payload?.data as PreviewResponse;
      setPreview(data);
      setRows(data.rows);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse import file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const startImport = async () => {
    setError(null);
    setStartingImport(true);
    try {
      setShowPreview(false);
      const allRows = selectedValidRows;
      const total = allRows.length;
      const batchSize = 50;
      let processed = 0;
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];

      const localJobId = crypto.randomUUID();
      setJob({
        id: localJobId,
        status: "running",
        total,
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        message: "Importing...",
        startedAt: new Date().toISOString(),
        finishedAt: null,
        errors,
      });

      for (let start = 0; start < allRows.length; start += batchSize) {
        const batch = allRows.slice(start, start + batchSize);
        const res = await fetch("/api/import/orders/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: batch }),
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);

        const data = payload?.data ?? {};
        processed += Number(data.processed ?? batch.length);
        inserted += Number(data.inserted ?? 0);
        updated += Number(data.updated ?? 0);
        skipped += Number(data.skipped ?? 0);
        failed += Number(data.failed ?? 0);
        if (Array.isArray(data.errors)) {
          errors.push(...data.errors.map(String));
        }

        const pct = Math.round((processed / Math.max(1, total)) * 100);
        setJob({
          id: localJobId,
          status: "running",
          total,
          processed: Math.min(total, processed),
          inserted,
          updated,
          skipped,
          failed,
          message: `Importing... ${pct}%`,
          startedAt: new Date().toISOString(),
          finishedAt: null,
          errors,
        });
      }

      setJob({
        id: localJobId,
        status: "completed",
        total,
        processed: total,
        inserted,
        updated,
        skipped,
        failed,
        message: "Import completed",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        errors,
      });

      onImportComplete?.(
        `Import completed: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start import.");
      setJob((current) =>
        current
          ? {
              ...current,
              status: "failed",
              message: err instanceof Error ? err.message : "Import failed.",
              finishedAt: new Date().toISOString(),
            }
          : current
      );
    } finally {
      setStartingImport(false);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Import Orders (CSV)</h2>
      <p className="text-sm text-slate-500 mb-4">
        Drag and drop a production export CSV, preview/adjust rows, then import with progress tracking.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-[#005B97] bg-[#005B97]/5"
            : "border-slate-300 bg-slate-50/70"
        }`}
      >
        <p className="text-sm text-slate-600">
          {uploading ? "Parsing file..." : "Drop CSV here or select a file"}
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-3 rounded-lg bg-[#005B97] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Choose CSV"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const inputEl = e.currentTarget;
            const file = e.target.files?.[0];
            if (!file) return;
            // Clear immediately so same file can be picked again and
            // we never touch event targets after awaiting async work.
            inputEl.value = "";
            await handleFile(file);
          }}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {preview ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              File: <span className="font-medium">{preview.fileName}</span>
            </span>
            <span>Rows parsed: {preview.parsedRows}</span>
            <span className="text-emerald-700">Valid: {preview.validRows}</span>
            <span className="text-red-700">Invalid: {preview.invalidRows}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Open Preview
          </button>
        </div>
      ) : null}

      {job ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-slate-700">Import Progress</span>
            <span className="text-slate-500">{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all ${
                job.status === "failed" ? "bg-red-500" : "bg-[#005B97]"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {job.message} — {job.processed}/{job.total} processed
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Inserted: {job.inserted} • Updated: {job.updated} • Skipped: {job.skipped} • Failed:{" "}
            {job.failed}
          </p>
        </div>
      ) : null}

      {showPreview && preview ? (
        <div className="fixed inset-0 z-10000 bg-black/55 p-3 sm:p-6">
          <div className="mx-auto h-full max-w-7xl rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">
                  Import Preview — {preview.fileName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select rows, adjust values, then start import.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={allSelectableChecked}
                  onChange={(e) =>
                    setRows((current) =>
                      current.map((row) =>
                        row.errors.length > 0 ? row : { ...row, selected: e.target.checked }
                      )
                    )
                  }
                />
                Select all valid rows
              </label>
              <span className="text-xs text-slate-500">
                Selected: {selectedValidRows.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="min-w-[1300px] w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-2 py-2">Sel</th>
                    <th className="text-left px-2 py-2">Action</th>
                    <th className="text-left px-2 py-2">Order #</th>
                    <th className="text-left px-2 py-2">Customer</th>
                    <th className="text-left px-2 py-2">Department</th>
                    <th className="text-left px-2 py-2">Station</th>
                    <th className="text-left px-2 py-2">Status</th>
                    <th className="text-left px-2 py-2">Ship Date</th>
                    <th className="text-right px-2 py-2">Amount</th>
                    <th className="text-left px-2 py-2">Rush</th>
                    <th className="text-left px-2 py-2">Sidemark</th>
                    <th className="text-left px-2 py-2">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${row.rowNumber}-${idx}`}
                      className={`border-t border-slate-100 ${
                        row.errors.length > 0 ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="px-2 py-1.5 align-top">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          disabled={row.errors.length > 0}
                          onChange={(e) =>
                            setRows((current) =>
                              current.map((target, targetIdx) =>
                                targetIdx === idx
                                  ? { ...target, selected: e.target.checked }
                                  : target
                              )
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <select
                          value={row.importAction}
                          onChange={(e) =>
                            setRows((current) =>
                              current.map((target, targetIdx) =>
                                targetIdx === idx
                                  ? {
                                      ...target,
                                      importAction: e.target.value as ImportOrderDraft["importAction"],
                                    }
                                  : target
                              )
                            )
                          }
                          className="rounded border border-slate-300 bg-white px-1.5 py-1"
                        >
                          <option value="create">Create</option>
                          <option value="update">Update</option>
                          <option value="skip">Skip</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <input
                          value={row.orderNumber}
                          onChange={(e) => editRow(setRows, idx, "orderNumber", e.target.value)}
                          className="w-24 rounded border border-slate-300 px-1.5 py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <input
                          value={row.customerName}
                          onChange={(e) =>
                            editRow(setRows, idx, "customerName", e.target.value)
                          }
                          className="w-44 rounded border border-slate-300 px-1.5 py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <input
                          value={row.department}
                          onChange={(e) =>
                            editRow(setRows, idx, "department", e.target.value)
                          }
                          className="w-32 rounded border border-slate-300 px-1.5 py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <select
                          value={row.currentStation}
                          onChange={(e) =>
                            editRow(setRows, idx, "currentStation", e.target.value)
                          }
                          className="w-32 rounded border border-slate-300 bg-white px-1.5 py-1"
                        >
                          <option value="">Select...</option>
                          {preview.stationOptions.map((station) => (
                            <option key={station.id} value={station.id}>
                              {station.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <input
                          value={row.status}
                          onChange={(e) => editRow(setRows, idx, "status", e.target.value)}
                          className="w-28 rounded border border-slate-300 px-1.5 py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <input
                          type="date"
                          value={row.shipDate ?? ""}
                          onChange={(e) =>
                            editRow(setRows, idx, "shipDate", e.target.value || null)
                          }
                          className="w-32 rounded border border-slate-300 px-1.5 py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={String(row.saleAmount)}
                          onChange={(e) =>
                            editRow(setRows, idx, "saleAmount", Number(e.target.value))
                          }
                          className="w-24 rounded border border-slate-300 px-1.5 py-1 text-right"
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <input
                          type="checkbox"
                          checked={row.isRush}
                          onChange={(e) => editRow(setRows, idx, "isRush", e.target.checked)}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <input
                          value={row.sidemark}
                          onChange={(e) => editRow(setRows, idx, "sidemark", e.target.value)}
                          className="w-40 rounded border border-slate-300 px-1.5 py-1"
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        {row.errors.length > 0 ? (
                          <div className="text-red-700">
                            {row.errors.map((item) => (
                              <div key={item}>{item}</div>
                            ))}
                          </div>
                        ) : row.warnings.length > 0 ? (
                          <div className="text-amber-700">
                            {row.warnings.map((item) => (
                              <div key={item}>{item}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-700">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Importing {selectedValidRows.length} selected valid rows.
              </span>
              <button
                type="button"
                onClick={startImport}
                disabled={selectedValidRows.length === 0 || startingImport}
                className="rounded-lg bg-[#005B97] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {startingImport ? "Starting..." : "Import Selected"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function editRow(
  setRows: Dispatch<SetStateAction<ImportOrderDraft[]>>,
  index: number,
  field: keyof ImportOrderDraft,
  value: string | number | boolean | null
) {
  setRows((current) =>
    current.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: value,
            errors:
              field === "currentStation" && !value
                ? ["Station is required."]
                : row.errors.filter((err) => err !== "Station is required."),
          }
        : row
    )
  );
}
