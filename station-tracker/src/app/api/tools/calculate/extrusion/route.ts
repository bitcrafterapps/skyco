import { NextRequest, NextResponse } from "next/server";
import {
  calculateExtrusion,
  defaultExtrusionInput,
  type ExtrusionCalculatorInput,
} from "@/lib/tools/calculators";
import { TOOLS_RULES_VERSION } from "@/lib/tools/rules";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<ExtrusionCalculatorInput>;
    const defaults = defaultExtrusionInput();
    const input: ExtrusionCalculatorInput = {
      finishedWidthIn: toNumber(body.finishedWidthIn, defaults.finishedWidthIn),
      bracketLeftDeductionIn: toNumber(
        body.bracketLeftDeductionIn,
        defaults.bracketLeftDeductionIn
      ),
      bracketRightDeductionIn: toNumber(
        body.bracketRightDeductionIn,
        defaults.bracketRightDeductionIn
      ),
      motorSideDeductionIn: toNumber(
        body.motorSideDeductionIn,
        defaults.motorSideDeductionIn
      ),
      idlerSideDeductionIn: toNumber(
        body.idlerSideDeductionIn,
        defaults.idlerSideDeductionIn
      ),
      endcapAllowanceIn: toNumber(
        body.endcapAllowanceIn,
        defaults.endcapAllowanceIn
      ),
      sawKerfIn: toNumber(body.sawKerfIn, defaults.sawKerfIn),
      toleranceIn: toNumber(body.toleranceIn, defaults.toleranceIn),
    };

    const result = calculateExtrusion(input);
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
    console.error("[POST /api/tools/calculate/extrusion]", err);
    return NextResponse.json(
      { data: null, error: "Failed to calculate extrusion values" },
      { status: 500 }
    );
  }
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
