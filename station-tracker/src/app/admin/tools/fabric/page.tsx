"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import AdminToolsShell from "@/components/AdminToolsShell";
import {
  defaultFabricInput,
  type FabricCalculatorInput,
  type FabricCalculatorResult,
} from "@/lib/tools/calculators";
import { FABRIC_RULES, TOOLS_RULES_VERSION } from "@/lib/tools/rules";

export default function FabricCalculatorPage() {
  const [form, setForm] = useState<FabricCalculatorInput>(defaultFabricInput());
  const [result, setResult] = useState<FabricCalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assumptions = useMemo(
    () => [
      `Rules version: ${TOOLS_RULES_VERSION}`,
      `Top allowance: ${FABRIC_RULES.topAllowanceIn}"`,
      `Standard roll: ${FABRIC_RULES.standardRollYards} yards`,
      `Default waste factor: ${FABRIC_RULES.defaultWastePercent}%`,
      `Pattern repeat rounds cut length upward to repeat multiple`,
    ],
    []
  );

  const onCalculate = async () => {
    const started = Date.now();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/calculate/fabric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);
      const calc = payload?.data?.result as FabricCalculatorResult;
      setResult(calc);
      await logToolRun("fabric-calculator", true, Date.now() - started);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate");
      await logToolRun("fabric-calculator", false, Date.now() - started);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm(defaultFabricInput());
    setResult(null);
    setError(null);
  };

  return (
    <AdminToolsShell
      title="Fabric Calculator"
      subtitle="Compute panel cuts, yardage, yield, and scrap estimates"
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
              <Field label="Shade Type">
                <select
                  value={form.shadeType}
                  onChange={(e) => setForm((f) => ({ ...f, shadeType: e.target.value }))}
                  className={inputClass}
                >
                  <option value="roller">Roller</option>
                  <option value="zebra">Zebra</option>
                  <option value="roman">Roman</option>
                </select>
              </Field>
              <NumberField
                label='Finished Width (")'
                value={form.finishedWidthIn}
                onChange={(value) => setForm((f) => ({ ...f, finishedWidthIn: value }))}
              />
              <NumberField
                label='Finished Drop (")'
                value={form.finishedDropIn}
                onChange={(value) => setForm((f) => ({ ...f, finishedDropIn: value }))}
              />
              <NumberField
                label='Roll Width (")'
                value={form.rollWidthIn}
                onChange={(value) => setForm((f) => ({ ...f, rollWidthIn: value }))}
              />
              <NumberField
                label="Quantity"
                value={form.quantity}
                onChange={(value) => setForm((f) => ({ ...f, quantity: Math.max(1, Math.floor(value)) }))}
              />
              <NumberField
                label='Seam Allowance (")'
                value={form.seamAllowanceIn}
                onChange={(value) => setForm((f) => ({ ...f, seamAllowanceIn: value }))}
              />
              <NumberField
                label='Hem Allowance (")'
                value={form.hemAllowanceIn}
                onChange={(value) => setForm((f) => ({ ...f, hemAllowanceIn: value }))}
              />
              <NumberField
                label='Pattern Repeat (")'
                value={form.patternRepeatIn}
                onChange={(value) => setForm((f) => ({ ...f, patternRepeatIn: value }))}
              />
              <NumberField
                label="Waste Factor (%)"
                value={form.wastePercent}
                onChange={(value) => setForm((f) => ({ ...f, wastePercent: value }))}
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
              <ResultCard label="Panel Count" value={String(result.panelCount)} />
              <ResultCard label='Cut Length / Panel' value={`${result.cutLengthPerPanelIn}"`} />
              <ResultCard label='Total Cut Length' value={`${result.totalCutLengthIn}"`} />
              <ResultCard label="Required Yardage" value={`${result.requiredYards} yd`} />
              <ResultCard
                label="Required Yardage + Waste"
                value={`${result.requiredYardsWithWaste} yd`}
              />
              <ResultCard
                label="Scrap Estimate"
                value={`${result.estimatedScrapPercent}%`}
              />
              <ResultCard
                label="Yield per Standard Roll"
                value={`${result.yieldPerStandardRoll} shades`}
              />
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
