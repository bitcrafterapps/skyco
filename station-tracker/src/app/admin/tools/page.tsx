"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminToolsShell from "@/components/AdminToolsShell";
import {
  FACTORY_TOOLS,
  TOOL_CATEGORIES,
  type ToolCategory,
} from "@/lib/tools/catalog";
import { TOOLS_SUCCESS_METRICS } from "@/lib/tools/rules";

type ToolsMetricsResponse = {
  summary: {
    totals: {
      runs: number;
      successRuns: number;
      avgDurationMs: number;
    };
  };
  kpis: {
    reworkReductionPct: number;
    prepTimeReductionPct: number;
    firstPassQcPct: number;
    toolRunsPerDay: number;
    activeStationsUsingTools: number;
  };
};

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);
  const [metrics, setMetrics] = useState<ToolsMetricsResponse | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/tools/runs", { cache: "no-store" });
        const payload = await res.json().catch(() => null);
        if (!res.ok) return;
        setMetrics(payload?.data ?? null);
      } catch {
        // Non-blocking metrics load
      }
    };
    fetchMetrics();
  }, []);

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();
    return FACTORY_TOOLS.filter((tool) => {
      const categoryOk = activeCategory === "all" || tool.category === activeCategory;
      if (!categoryOk) return false;
      if (!query) return true;
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.summary.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    }).sort((a, b) => a.priority - b.priority);
  }, [activeCategory, search]);

  const byTier = useMemo(
    () => ({
      tier1: filteredTools.filter((tool) => tool.tier === 1),
      tier2: filteredTools.filter((tool) => tool.tier === 2),
      tier3: filteredTools.filter((tool) => tool.tier === 3),
    }),
    [filteredTools]
  );

  const kpis = metrics?.kpis;
  const successRate = metrics
    ? Math.round(
        ((metrics.summary.totals.successRuns || 0) /
          Math.max(1, metrics.summary.totals.runs || 0)) *
          100
      )
    : 0;

  return (
    <AdminToolsShell
      title="Tools"
      subtitle="Factory-floor calculators, quality checks, and planning utilities"
    >
      <div className="tools-index-page max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="tools-surface-card rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Factory Floor Tools Roadmap
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Prioritized tools for cutting, motorization, QC, and production planning.
              </p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools"
              className="tools-input w-full lg:w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`tools-filter-pill rounded-lg px-3 py-1.5 text-xs font-semibold border ${
                activeCategory === "all"
                  ? "bg-[#005B97] text-white border-[#005B97]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {TOOL_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`tools-filter-pill rounded-lg px-3 py-1.5 text-xs font-semibold border ${
                  activeCategory === category.id
                    ? "bg-[#005B97] text-white border-[#005B97]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <MetricCard
            label="Tool Runs / Day"
            value={String(kpis?.toolRunsPerDay ?? 0)}
            sub="Adoption pulse"
          />
          <MetricCard
            label="Active Stations"
            value={String(kpis?.activeStationsUsingTools ?? 0)}
            sub="Using tools today"
          />
          <MetricCard
            label="Run Success Rate"
            value={`${successRate}%`}
            sub="Successful results"
          />
          <MetricCard
            label={TOOLS_SUCCESS_METRICS[0].label}
            value={`${kpis?.reworkReductionPct ?? 0}%`}
            sub={TOOLS_SUCCESS_METRICS[0].description}
          />
          <MetricCard
            label={TOOLS_SUCCESS_METRICS[2].label}
            value={`${kpis?.firstPassQcPct ?? 0}%`}
            sub={TOOLS_SUCCESS_METRICS[2].description}
          />
        </section>

        <section className="tools-surface-card rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <TierTab
              active={activeTier === 1}
              onClick={() => setActiveTier(1)}
              label="Tier 1"
            />
            <TierTab
              active={activeTier === 2}
              onClick={() => setActiveTier(2)}
              label="Tier 2"
            />
            <TierTab
              active={activeTier === 3}
              onClick={() => setActiveTier(3)}
              label="Tier 3"
            />
          </div>
          <div className="p-4 sm:p-5">
            {activeTier === 1 ? (
              <ToolCardsGrid
                tools={byTier.tier1}
                emptyText="No Tier 1 tools match your filters."
              />
            ) : activeTier === 2 ? (
              <ToolCardsGrid
                tools={byTier.tier2}
                emptyText="No Tier 2 tools match your filters."
              />
            ) : (
              <ToolCardsGrid
                tools={byTier.tier3}
                emptyText="No Tier 3 tools match your filters."
              />
            )}
          </div>
        </section>
      </div>
    </AdminToolsShell>
  );
}

function TierTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tools-filter-pill tools-tier-tab rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
        active
          ? "tools-tier-tab-active bg-[#005B97] text-white border-[#005B97]"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function ToolCardsGrid({
  tools,
  emptyText,
}: {
  tools: typeof FACTORY_TOOLS;
  emptyText: string;
}) {
  return (
    <>
      {tools.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <article
              key={tool.id}
              className="tools-soft-card rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{tool.name}</p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{tool.category}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    tool.status === "ready"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {tool.status === "ready" ? "Ready" : "Planned"}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{tool.summary}</p>
              <div className="mt-3">
                <Link
                  href={tool.route}
                  className={`tools-open-link inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold border ${
                    tool.status === "ready"
                      ? "text-[#005B97] border-[#005B97]/30 bg-white hover:bg-[#005B97]/5"
                      : "text-slate-500 border-slate-300 bg-white"
                  }`}
                >
                  {tool.status === "ready" ? "Open Tool" : "View Plan"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <article className="tools-metric-card rounded-xl border border-slate-200 bg-white shadow-sm p-3.5">
      <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{value}</p>
      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{sub}</p>
    </article>
  );
}
