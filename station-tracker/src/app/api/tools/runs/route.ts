import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/queries";

export const dynamic = "force-dynamic";

const RUNS_KEY = "tools_runs_v1";
const KPI_BASELINE_KEY = "tools_kpi_baseline_v1";

type ToolRunPayload = {
  toolId: string;
  durationMs?: number;
  success?: boolean;
  stationId?: string;
};

type ToolRunsStore = {
  totals: {
    runs: number;
    successRuns: number;
    avgDurationMs: number;
  };
  byTool: Record<string, { runs: number; successRuns: number }>;
  byDay: Record<string, number>;
  byStation: Record<string, number>;
  lastRunAt: string | null;
};

const EMPTY_STORE: ToolRunsStore = {
  totals: {
    runs: 0,
    successRuns: 0,
    avgDurationMs: 0,
  },
  byTool: {},
  byDay: {},
  byStation: {},
  lastRunAt: null,
};

export async function GET() {
  try {
    const [runsRaw, baselineRaw] = await Promise.all([
      getSetting(RUNS_KEY),
      getSetting(KPI_BASELINE_KEY),
    ]);

    const store = parseStore(runsRaw);
    const baseline = parseBaseline(baselineRaw);
    const today = new Date().toISOString().slice(0, 10);
    const toolRunsPerDay = store.byDay[today] ?? 0;
    const activeStationsUsingTools = Object.keys(store.byStation).length;

    return NextResponse.json({
      data: {
        summary: store,
        kpis: {
          reworkReductionPct: baseline.reworkReductionPct,
          prepTimeReductionPct: baseline.prepTimeReductionPct,
          firstPassQcPct: baseline.firstPassQcPct,
          toolRunsPerDay,
          activeStationsUsingTools,
        },
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/tools/runs]", err);
    return NextResponse.json(
      { data: null, error: "Failed to load tools run summary" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ToolRunPayload;
    if (!body.toolId || typeof body.toolId !== "string") {
      return NextResponse.json(
        { data: null, error: "toolId is required" },
        { status: 400 }
      );
    }

    const existingRaw = await getSetting(RUNS_KEY);
    const store = parseStore(existingRaw);

    const success = body.success !== false;
    const durationMs = Math.max(0, Number(body.durationMs ?? 0));
    const stationId = body.stationId?.trim() || "unknown";
    const day = new Date().toISOString().slice(0, 10);

    const previousRuns = store.totals.runs;
    const nextRuns = previousRuns + 1;
    const nextAvgDuration =
      previousRuns === 0
        ? durationMs
        : (store.totals.avgDurationMs * previousRuns + durationMs) / nextRuns;

    store.totals.runs = nextRuns;
    store.totals.successRuns += success ? 1 : 0;
    store.totals.avgDurationMs = Math.round(nextAvgDuration);
    store.lastRunAt = new Date().toISOString();

    if (!store.byTool[body.toolId]) {
      store.byTool[body.toolId] = { runs: 0, successRuns: 0 };
    }
    store.byTool[body.toolId].runs += 1;
    store.byTool[body.toolId].successRuns += success ? 1 : 0;
    store.byDay[day] = (store.byDay[day] ?? 0) + 1;
    store.byStation[stationId] = (store.byStation[stationId] ?? 0) + 1;

    await setSetting(RUNS_KEY, JSON.stringify(store));

    return NextResponse.json({ data: { ok: true, summary: store }, error: null });
  } catch (err) {
    console.error("[POST /api/tools/runs]", err);
    return NextResponse.json(
      { data: null, error: "Failed to record tool run" },
      { status: 500 }
    );
  }
}

function parseStore(raw: string | null): ToolRunsStore {
  if (!raw) return { ...EMPTY_STORE };
  try {
    const parsed = JSON.parse(raw) as ToolRunsStore;
    return {
      totals: {
        runs: Number(parsed?.totals?.runs ?? 0),
        successRuns: Number(parsed?.totals?.successRuns ?? 0),
        avgDurationMs: Number(parsed?.totals?.avgDurationMs ?? 0),
      },
      byTool: parsed?.byTool ?? {},
      byDay: parsed?.byDay ?? {},
      byStation: parsed?.byStation ?? {},
      lastRunAt: parsed?.lastRunAt ?? null,
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

function parseBaseline(raw: string | null): {
  reworkReductionPct: number;
  prepTimeReductionPct: number;
  firstPassQcPct: number;
} {
  if (!raw) {
    return {
      reworkReductionPct: 0,
      prepTimeReductionPct: 0,
      firstPassQcPct: 0,
    };
  }
  try {
    const parsed = JSON.parse(raw) as {
      reworkReductionPct?: number;
      prepTimeReductionPct?: number;
      firstPassQcPct?: number;
    };
    return {
      reworkReductionPct: Number(parsed.reworkReductionPct ?? 0),
      prepTimeReductionPct: Number(parsed.prepTimeReductionPct ?? 0),
      firstPassQcPct: Number(parsed.firstPassQcPct ?? 0),
    };
  } catch {
    return {
      reworkReductionPct: 0,
      prepTimeReductionPct: 0,
      firstPassQcPct: 0,
    };
  }
}
