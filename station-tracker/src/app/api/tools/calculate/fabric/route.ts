import { NextRequest, NextResponse } from "next/server";
import {
  calculateFabric,
  defaultFabricInput,
  type FabricCalculatorInput,
} from "@/lib/tools/calculators";
import { TOOLS_RULES_VERSION } from "@/lib/tools/rules";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<FabricCalculatorInput>;
    const defaults = defaultFabricInput();

    const input: FabricCalculatorInput = {
      shadeType: String(body.shadeType ?? defaults.shadeType),
      finishedWidthIn: toNumber(body.finishedWidthIn, defaults.finishedWidthIn),
      finishedDropIn: toNumber(body.finishedDropIn, defaults.finishedDropIn),
      rollWidthIn: toNumber(body.rollWidthIn, defaults.rollWidthIn),
      quantity: Math.max(1, Math.floor(toNumber(body.quantity, defaults.quantity))),
      seamAllowanceIn: toNumber(body.seamAllowanceIn, defaults.seamAllowanceIn),
      hemAllowanceIn: toNumber(body.hemAllowanceIn, defaults.hemAllowanceIn),
      patternRepeatIn: toNumber(body.patternRepeatIn, defaults.patternRepeatIn),
      wastePercent: toNumber(body.wastePercent, defaults.wastePercent),
    };

    const result = calculateFabric(input);
    return NextResponse.json({
      data: {
        input,
        result,
        rulesVersion: TOOLS_RULES_VERSION,
        calculatedAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/tools/calculate/fabric]", err);
    return NextResponse.json(
      { data: null, error: "Failed to calculate fabric values" },
      { status: 500 }
    );
  }
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
