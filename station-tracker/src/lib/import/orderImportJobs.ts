import { prisma } from "@/lib/db";
import type { ImportJob, ImportOrderDraft } from "@/lib/import/types";

const jobStore = new Map<string, ImportJob>();

export function createImportJob(rows: ImportOrderDraft[]): ImportJob {
  const id = crypto.randomUUID();
  const job: ImportJob = {
    id,
    status: "queued",
    total: rows.length,
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    message: "Queued",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    errors: [],
  };
  jobStore.set(id, job);
  void runImportJob(job, rows);
  return job;
}

export function getImportJob(id: string): ImportJob | null {
  return jobStore.get(id) ?? null;
}

export type ImportBatchSummary = {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export async function processImportRows(
  rows: ImportOrderDraft[]
): Promise<ImportBatchSummary> {
  const summary: ImportBatchSummary = {
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const row of rows) {
    try {
      if (row.errors.length > 0 || !row.selected || row.importAction === "skip") {
        summary.skipped += 1;
        continue;
      }

      const existing = await prisma.order.findUnique({
        where: { orderNumber: row.orderNumber },
        select: { id: true },
      });

      if (existing && row.importAction === "create") {
        row.importAction = "update";
      }

      if (!existing && row.importAction === "update") {
        summary.skipped += 1;
        summary.errors.push(
          `Row ${row.rowNumber}: order ${row.orderNumber} not found for update action.`
        );
        continue;
      }

      const payload = {
        customerName: row.customerName,
        department: row.department,
        currentStation: row.currentStation,
        status: row.status,
        shipDate: row.shipDate,
        saleAmount: row.saleAmount,
        sidemark: row.sidemark,
        notes: row.notes,
        target: row.target,
        isRush: row.isRush,
      };

      if (existing) {
        await prisma.order.update({
          where: { orderNumber: row.orderNumber },
          data: payload,
        });
        summary.updated += 1;
      } else {
        await prisma.order.create({
          data: {
            orderNumber: row.orderNumber,
            ...payload,
          },
        });
        summary.inserted += 1;
      }
    } catch (err) {
      summary.failed += 1;
      summary.errors.push(
        `Row ${row.rowNumber}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      summary.processed += 1;
    }
  }

  return summary;
}

async function runImportJob(job: ImportJob, rows: ImportOrderDraft[]) {
  try {
    job.status = "running";
    job.message = "Importing rows...";

    for (const row of rows) {
      try {
        if (row.errors.length > 0 || !row.selected || row.importAction === "skip") {
          job.skipped += 1;
          continue;
        }

        const existing = await prisma.order.findUnique({
          where: { orderNumber: row.orderNumber },
          select: { id: true },
        });

        // Enforce upsert-like behavior requested by product:
        // existing order numbers should always update, not skip.
        if (existing && row.importAction === "create") {
          row.importAction = "update";
        }

        if (!existing && row.importAction === "update") {
          job.skipped += 1;
          job.errors.push(
            `Row ${row.rowNumber}: order ${row.orderNumber} not found for update action.`
          );
          continue;
        }

        const payload = {
          customerName: row.customerName,
          department: row.department,
          currentStation: row.currentStation,
          status: row.status,
          shipDate: row.shipDate,
          saleAmount: row.saleAmount,
          sidemark: row.sidemark,
          notes: row.notes,
          target: row.target,
          isRush: row.isRush,
        };

        if (existing) {
          await prisma.order.update({
            where: { orderNumber: row.orderNumber },
            data: payload,
          });
          job.updated += 1;
        } else {
          await prisma.order.create({
            data: {
              orderNumber: row.orderNumber,
              ...payload,
            },
          });
          job.inserted += 1;
        }
      } catch (err) {
        job.failed += 1;
        job.errors.push(
          `Row ${row.rowNumber}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      } finally {
        job.processed = Math.min(job.total, job.processed + 1);
        const pct = Math.round((job.processed / Math.max(1, job.total)) * 100);
        job.message = `Importing... ${pct}%`;
      }
    }

    job.status = "completed";
    job.message = "Import completed";
    job.finishedAt = new Date().toISOString();
  } catch (err) {
    job.status = "failed";
    job.message = err instanceof Error ? err.message : "Import failed";
    job.finishedAt = new Date().toISOString();
  }
}
