"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminToolsShell from "@/components/AdminToolsShell";
import {
  getDynamicToolBySlug,
  type ToolFieldDefinition,
} from "@/lib/tools/definitions";

type CalculationResponse = {
  data?: {
    input?: Record<string, number | string | boolean>;
    result?: Record<string, number | string | boolean>;
  };
  error?: string | null;
};

export default function DynamicToolPage() {
  const params = useParams<{ toolSlug: string }>();
  const tool = getDynamicToolBySlug(params.toolSlug ?? "");
  if (!tool) {
    return (
      <AdminToolsShell
        title="Tool Not Found"
        subtitle="The requested tool route is not currently configured."
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <section className="tools-surface-card rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <p className="text-sm text-slate-600">
              This tool route does not exist yet.
            </p>
            <Link
              href="/admin/tools"
              className="tools-back-link inline-flex items-center text-sm font-medium text-[#005B97] hover:underline mt-3"
            >
              ← Back to Tools
            </Link>
          </section>
        </div>
      </AdminToolsShell>
    );
  }

  return <ToolRunner tool={tool} />;
}

function ToolRunner({
  tool,
}: {
  tool: NonNullable<ReturnType<typeof getDynamicToolBySlug>>;
}) {

  const [form, setForm] = useState<Record<string, number | string | boolean>>(
    tool.defaultInput
  );
  const [result, setResult] = useState<Record<string, number | string | boolean> | null>(
    null
  );
  const [formulaSummary, setFormulaSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultRows = useMemo(() => {
    return tool.results.map((row) => {
      const raw = result?.[row.key];
      if (raw === undefined || raw === null || raw === "") {
        return { ...row, value: "—" };
      }
      if (typeof raw === "boolean") {
        return { ...row, value: raw ? "Yes" : "No" };
      }
      return { ...row, value: `${raw}${row.suffix ?? ""}` };
    });
  }, [result, tool.results]);

  const onCalculate = async () => {
    const started = Date.now();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/calculate/${tool.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await res.json().catch(() => null)) as CalculationResponse | null;
      if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);

      const nextResult = payload?.data?.result ?? {};
      setResult(nextResult);
      setFormulaSummary(String(nextResult.formulaSummary ?? ""));
      await logToolRun(tool.id, true, Date.now() - started);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate");
      await logToolRun(tool.id, false, Date.now() - started);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm(tool.defaultInput);
    setResult(null);
    setFormulaSummary("");
    setError(null);
  };

  return (
    <AdminToolsShell title={tool.title} subtitle={tool.subtitle}>
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
              {tool.fields.map((field) => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
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
              {tool.assumptions.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="tools-surface-card rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
            {resultRows.map((row) => (
              <article
                key={row.key}
                className="tools-result-card rounded-lg border border-slate-200 bg-slate-50/70 p-3"
              >
                <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                  {row.label}
                </p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    row.tone === "good"
                      ? "text-emerald-600"
                      : row.tone === "warn"
                        ? "text-amber-600"
                        : "text-slate-900"
                  }`}
                >
                  {row.value}
                </p>
              </article>
            ))}
          </div>
          {formulaSummary ? (
            <p className="text-xs text-slate-500 mt-3">{formulaSummary}</p>
          ) : null}
        </section>
      </div>
    </AdminToolsShell>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ToolFieldDefinition;
  value: number | string | boolean | undefined;
  onChange: (next: number | string | boolean) => void;
}) {
  const current = value ?? "";

  if (field.type === "boolean") {
    return (
      <Field label={field.label}>
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <input
            type="checkbox"
            checked={Boolean(current)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-sm text-slate-700">Enabled</span>
        </label>
      </Field>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label}>
        <select
          value={String(current)}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  return (
    <Field label={field.label}>
      <input
        type="number"
        step={field.step ?? "0.01"}
        value={String(current)}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </Field>
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
