import { NextRequest, NextResponse } from "next/server";
import {
  calculateBatchOptimization,
  calculateBomQuick,
  calculateBracketSelector,
  calculateCapacitySimulator,
  calculateElectricalLoad,
  calculateMotorSizing,
  calculatePackagingFreight,
  calculateProductionTime,
  calculateQcTolerance,
  calculateScrapYield,
} from "@/lib/tools/calculators";
import { getDynamicToolById } from "@/lib/tools/definitions";
import { TOOLS_RULES_VERSION } from "@/lib/tools/rules";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await context.params;
    const definition = getDynamicToolById(toolId);
    if (!definition) {
      return NextResponse.json(
        { data: null, error: `Unknown tool id: ${toolId}` },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const normalizedInput = normalizeInput(body, definition.defaultInput);
    const result = calculateByToolId(toolId, normalizedInput);

    return NextResponse.json({
      data: {
        input: normalizedInput,
        result,
        rulesVersion: TOOLS_RULES_VERSION,
        calculatedAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/tools/calculate/[toolId]]", err);
    return NextResponse.json(
      { data: null, error: "Failed to calculate tool values" },
      { status: 500 }
    );
  }
}

function normalizeInput(
  input: Record<string, unknown>,
  defaults: Record<string, number | string | boolean>
): Record<string, number | string | boolean> {
  const out: Record<string, number | string | boolean> = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const raw = input[key];
    if (typeof defaultValue === "number") {
      const parsed = Number(raw);
      out[key] = Number.isFinite(parsed) ? parsed : defaultValue;
    } else if (typeof defaultValue === "boolean") {
      out[key] =
        typeof raw === "boolean"
          ? raw
          : typeof raw === "string"
            ? raw.toLowerCase() === "true"
            : defaultValue;
    } else {
      out[key] = typeof raw === "string" ? raw : defaultValue;
    }
  }
  return out;
}

function calculateByToolId(
  toolId: string,
  input: Record<string, number | string | boolean>
) {
  switch (toolId) {
    case "motor-sizing-calculator":
      return calculateMotorSizing(
        input as Parameters<typeof calculateMotorSizing>[0]
      );
    case "bom-quick-calc":
      return calculateBomQuick(input as Parameters<typeof calculateBomQuick>[0]);
    case "production-time-estimator":
      return calculateProductionTime(
        input as Parameters<typeof calculateProductionTime>[0]
      );
    case "bracket-selector":
      return calculateBracketSelector(
        input as Parameters<typeof calculateBracketSelector>[0]
      );
    case "electrical-load-calc":
      return calculateElectricalLoad(
        input as Parameters<typeof calculateElectricalLoad>[0]
      );
    case "packaging-freight-estimator":
      return calculatePackagingFreight(
        input as Parameters<typeof calculatePackagingFreight>[0]
      );
    case "qc-tolerance-checker":
      return calculateQcTolerance(input as Parameters<typeof calculateQcTolerance>[0]);
    case "batch-optimization-planner":
      return calculateBatchOptimization(
        input as Parameters<typeof calculateBatchOptimization>[0]
      );
    case "scrap-yield-analytics":
      return calculateScrapYield(input as Parameters<typeof calculateScrapYield>[0]);
    case "capacity-simulator":
      return calculateCapacitySimulator(
        input as Parameters<typeof calculateCapacitySimulator>[0]
      );
    default:
      throw new Error(`Unsupported tool id: ${toolId}`);
  }
}
