"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import AdminToolsShell from "@/components/AdminToolsShell";
import {
  defaultExtrusionInput,
  type ExtrusionCalculatorInput,
  type ExtrusionCalculatorResult,
} from "@/lib/tools/calculators";
import { EXTRUSION_RULES, TOOLS_RULES_VERSION } from "@/lib/tools/rules";

export default function ExtrusionCalculatorPage() {
  const [form, setForm] = useState<ExtrusionCalculatorInput>(defaultExtrusionInput());
  const [result, setResult] = useState<ExtrusionCalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assumptions = useMemo(
    () => [
      `Rules version: ${TOOLS_RULES_VERSION}`,
      `Saw kerf default: ${EXTRUSION_RULES.defaultSawKerfIn}"`,
      `Tolerance default: ±${EXTRUSION_RULES.defaultToleranceIn}"`,
      "Net cut is based on total physical deductions from finished width",
      "QC pass window uses target cut ± tolerance",
    ],
    []
  );

  const onCalculate = async () => {
    const started = Date.now();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/calculate/extrusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);
      const calc = payload?.data?.result as ExtrusionCalculatorResult;
      setResult(calc);
      await logToolRun("extrusion-calculator", true, Date.now() - started);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate");
      await logToolRun("extrusion-calculator", false, Date.now() - started);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm(defaultExtrusionInput());
    setResult(null);
    setError(null);
  };

  return (
    <AdminToolsShell
      title="Extrusion / Tube Cut Calculator"
      subtitle="Calculate net cut length and tolerance window for shop-floor cutting"
    >
      <div className="tools-calculator-page max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4">
          <Link
            href="/admin/tools"
            className="tools-back-link inline-flex items-center text-sm font-medium text-[#005B97] hover:underline"
          >
            ← Back to Tools
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="tools-surface-card xl:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Inputs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <NumberField
                label='Finished Width (")'
                value={form.finishedWidthIn}
                onChange={(value) => setForm((f) => ({ ...f, finishedWidthIn: value }))}
              />
              <NumberField
                label='Bracket Left Deduction (")'
                value={form.bracketLeftDeductionIn}
                onChange={(value) =>
                  setForm((f) => ({ ...f, bracketLeftDeductionIn: value }))
                }
              />
              <NumberField
                label='Bracket Right Deduction (")'
                value={form.bracketRightDeductionIn}
                onChange={(value) =>
                  setForm((f) => ({ ...f, bracketRightDeductionIn: value }))
                }
              />
              <NumberField
                label='Motor Side Deduction (")'
                value={form.motorSideDeductionIn}
                onChange={(value) =>
                  setForm((f) => ({ ...f, motorSideDeductionIn: value }))
                }
              />
              <NumberField
                label='Idler Side Deduction (")'
                value={form.idlerSideDeductionIn}
                onChange={(value) =>
                  setForm((f) => ({ ...f, idlerSideDeductionIn: value }))
                }
              />
              <NumberField
                label='Endcap Allowance (")'
                value={form.endcapAllowanceIn}
                onChange={(value) => setForm((f) => ({ ...f, endcapAllowanceIn: value }))}
              />
              <NumberField
                label='Saw Kerf (")'
                value={form.sawKerfIn}
                onChange={(value) => setForm((f) => ({ ...f, sawKerfIn: value }))}
              />
              <NumberField
                label='Tolerance (±")'
                value={form.toleranceIn}
                onChange={(value) => setForm((f) => ({ ...f, toleranceIn: value }))}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onCalculate}
                disabled={loading}
                className="rounded-lg bg-[#005B97] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Calculating..." : "Calculate"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Reset
              </button>
              {error ? <span className="text-sm text-red-600">{error}</span> : null}
            </div>
          </section>

          <section className="tools-surface-card rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Assumptions
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {assumptions.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="tools-surface-card rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Results</h2>
          {!result ? (
            <p className="text-sm text-slate-500 mt-2">Run a calculation to view results.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
              <ResultCard label='Net Cut Length' value={`${result.netCutLengthIn}"`} />
              <ResultCard label='Tolerance Min' value={`${result.toleranceMinIn}"`} />
              <ResultCard label='Tolerance Max' value={`${result.toleranceMaxIn}"`} />
              <ResultCard label='Total Deductions' value={`${result.totalDeductionsIn}"`} />
              <ResultCard label='QC Target' value={`${result.qcTargetIn}"`} />
            </div>
          )}
          {result ? (
            <p className="text-xs text-slate-500 mt-3">{result.formulaSummary}</p>
          ) : null}
        </section>
      </div>
    </AdminToolsShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        step="0.01"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </Field>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="tools-result-card rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
    </article>
  );
}

const inputClass =
  "tools-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none";

async function logToolRun(toolId: string, success: boolean, durationMs: number) {
  try {
    await fetch("/api/tools/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId, success, durationMs }),
    });
  } catch {
    // Non-blocking metric write
  }
}
