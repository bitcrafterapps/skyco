"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Filter,
  Gauge,
  Search,
  TrendingUp,
  CalendarDays,
  Activity,
} from "lucide-react";
import AdminSubNav from "@/components/AdminSubNav";
import AppFooter from "@/components/AppFooter";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";

type ReportRow = {
  id: number;
  orderNumber: string;
  customerName: string;
  department: string;
  currentStation: string;
  status: string;
  isRush: boolean;
  shipDate: string | null;
  saleAmount: number;
  sidemark: string;
  target: string;
  createdAt: string;
  updatedAt: string;
  hasHold: boolean;
  hasMissing: boolean;
  isDoneAtCurrentStation: boolean;
};

type ReportData = {
  metrics: {
    totalOrders: number;
    rushOrders: number;
    holdOrders: number;
    missingOrders: number;
    doneAtCurrentStation: number;
    totalSaleAmount: number;
    avgSaleAmount: number;
  };
  charts: {
    statusCounts: Record<string, number>;
    stationCounts: Record<string, number>;
    dailyCounts: Record<string, number>;
  };
  rows: ReportRow[];
};

type Filters = {
  search: string;
  station: string;
  status: string;
  rush: "all" | "true" | "false";
  startDate: string;
  endDate: string;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  station: "",
  status: "",
  rush: "all",
  startDate: "",
  endDate: "",
};

function toCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function toDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function percentage(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeFilters.search.trim()) params.set("search", activeFilters.search.trim());
      if (activeFilters.station) params.set("station", activeFilters.station);
      if (activeFilters.status) params.set("status", activeFilters.status);
      if (activeFilters.rush !== "all") params.set("rush", activeFilters.rush);
      if (activeFilters.startDate) params.set("startDate", activeFilters.startDate);
      if (activeFilters.endDate) params.set("endDate", activeFilters.endDate);

      const res = await fetch(`/api/reports/orders?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);
      setReport(payload?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(DEFAULT_FILTERS);
  }, [fetchReport]);

  const stationOptions = useMemo(
    () => Object.keys(report?.charts.stationCounts ?? {}).sort((a, b) => a.localeCompare(b)),
    [report?.charts.stationCounts]
  );
  const statusOptions = useMemo(
    () => Object.keys(report?.charts.statusCounts ?? {}).sort((a, b) => a.localeCompare(b)),
    [report?.charts.statusCounts]
  );

  const statusBars = useMemo(() => {
    const rows = Object.entries(report?.charts.statusCounts ?? {}).map(([label, value]) => ({
      label,
      value,
    }));
    return rows.sort((a, b) => b.value - a.value).slice(0, 8);
  }, [report?.charts.statusCounts]);

  const stationBars = useMemo(() => {
    const rows = Object.entries(report?.charts.stationCounts ?? {}).map(([label, value]) => ({
      label,
      value,
    }));
    return rows.sort((a, b) => b.value - a.value).slice(0, 8);
  }, [report?.charts.stationCounts]);

  const dailyBars = useMemo(() => {
    const rows = Object.entries(report?.charts.dailyCounts ?? {}).map(([day, value]) => ({
      day,
      value,
    }));
    return rows.sort((a, b) => a.day.localeCompare(b.day)).slice(-21);
  }, [report?.charts.dailyCounts]);

  const maxStatus = Math.max(...statusBars.map((row) => row.value), 1);
  const maxStation = Math.max(...stationBars.map((row) => row.value), 1);
  const maxDaily = Math.max(...dailyBars.map((row) => row.value), 1);

  const metrics = report?.metrics;
  const donePct = percentage(
    metrics?.doneAtCurrentStation ?? 0,
    metrics?.totalOrders ?? 0
  );
  const issuePct = percentage(
    (metrics?.holdOrders ?? 0) + (metrics?.missingOrders ?? 0),
    metrics?.totalOrders ?? 0
  );

  const runSearch = async () => {
    await fetchReport(filters);
  };

  const resetSearch = async () => {
    setFilters(DEFAULT_FILTERS);
    await fetchReport(DEFAULT_FILTERS);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.station) params.set("station", filters.station);
      if (filters.status) params.set("status", filters.status);
      if (filters.rush !== "all") params.set("rush", filters.rush);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      params.set("format", "csv");

      const res = await fetch(`/api/reports/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `orders-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      <header
        className="relative px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:py-5"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,91,151,0.06)",
          borderBottom: "1px solid rgba(0,91,151,0.08)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 15% 50%, rgba(0,91,151,0.04) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full md:w-auto min-w-0 md:min-w-[290px]">
            <Link
              href="/admin"
              className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97] shrink-0"
              style={{
                background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,91,151,0.08)",
              }}
              aria-label="Back to admin"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
            <SmartLogoLink alt="Skyco" imgClassName="h-7 sm:h-8 md:h-10 w-auto" />
            <div className="h-6 sm:h-7 md:h-8 w-px bg-slate-200" />
            <div className="min-w-0 flex-1">
              <h1
                className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap"
                style={{ letterSpacing: "-0.02em" }}
              >
                Reports
              </h1>
              <p className="text-xs text-[#6497B0] font-medium hidden lg:block">
                Operational analytics and export center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full md:flex-1 md:min-w-0 justify-start md:justify-end overflow-x-auto overflow-y-visible hide-scrollbar pb-0.5 md:pb-0">
            <ThemeToggle />
            <OrderSearch theme="light" />
          </div>
        </div>
      </header>

      <AdminSubNav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-[#005B97]" />
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                Search & Filters
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    placeholder="Order #, customer, sidemark"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Station</label>
                <select
                  value={filters.station}
                  onChange={(e) => setFilters((f) => ({ ...f, station: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none"
                >
                  <option value="">All</option>
                  {stationOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none"
                >
                  <option value="">All</option>
                  {statusOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Rush</label>
                <select
                  value={filters.rush}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, rush: e.target.value as Filters["rush"] }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="true">Rush only</option>
                  <option value="false">Non-rush</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Created From</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Created To</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={runSearch}
                className="rounded-lg bg-[#005B97] px-4 py-2 text-sm font-medium text-white active:bg-[#004A7C] transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={resetSearch}
                className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 active:bg-slate-200 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={exportCsv}
                disabled={exporting || loading}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </section>

          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Loading reports...
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Orders"
                  value={String(metrics?.totalOrders ?? 0)}
                  subtitle="Current filtered dataset"
                  icon={<BarChart3 className="h-4 w-4" />}
                />
                <MetricCard
                  title="Total Revenue"
                  value={toCurrency(metrics?.totalSaleAmount ?? 0)}
                  subtitle={`Avg ${toCurrency(metrics?.avgSaleAmount ?? 0)} / order`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard
                  title="Rush Orders"
                  value={String(metrics?.rushOrders ?? 0)}
                  subtitle={`${percentage(metrics?.rushOrders ?? 0, metrics?.totalOrders ?? 0)}% of volume`}
                  icon={<Activity className="h-4 w-4" />}
                />
                <MetricCard
                  title="Issue Orders"
                  value={String((metrics?.holdOrders ?? 0) + (metrics?.missingOrders ?? 0))}
                  subtitle={`${issuePct}% hold/missing`}
                  icon={<Gauge className="h-4 w-4" />}
                />
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GaugeCard
                  title="Done At Current Station"
                  value={donePct}
                  subtitle={`${metrics?.doneAtCurrentStation ?? 0} / ${metrics?.totalOrders ?? 0} orders`}
                  tone="blue"
                />
                <GaugeCard
                  title="Hold Ratio"
                  value={percentage(metrics?.holdOrders ?? 0, metrics?.totalOrders ?? 0)}
                  subtitle={`${metrics?.holdOrders ?? 0} orders on hold`}
                  tone="rose"
                />
                <GaugeCard
                  title="Missing Ratio"
                  value={percentage(metrics?.missingOrders ?? 0, metrics?.totalOrders ?? 0)}
                  subtitle={`${metrics?.missingOrders ?? 0} orders missing parts`}
                  tone="amber"
                />
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ChartCard title="Status Distribution" icon={<BarChart3 className="h-4 w-4" />}>
                  <BarList rows={statusBars} max={maxStatus} />
                </ChartCard>
                <ChartCard title="Station Distribution" icon={<Activity className="h-4 w-4" />}>
                  <BarList rows={stationBars} max={maxStation} />
                </ChartCard>
              </section>

              <ChartCard title="Daily Created Orders (Last 21 Days)" icon={<CalendarDays className="h-4 w-4" />}>
                <div className="flex items-end gap-1 h-36">
                  {dailyBars.length === 0 ? (
                    <p className="text-sm text-slate-400">No daily activity for selected filters.</p>
                  ) : (
                    dailyBars.map((row) => (
                      <div key={row.day} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-sm bg-[#005B97]/80 hover:bg-[#005B97] transition-colors"
                          style={{
                            height: `${Math.max(10, (row.value / maxDaily) * 110)}px`,
                          }}
                          title={`${row.day}: ${row.value}`}
                        />
                        <span className="text-[10px] text-slate-400 truncate w-full text-center">
                          {row.day.slice(5)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ChartCard>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Report Details
                  </h3>
                  <span className="text-xs text-slate-500">
                    {(report?.rows ?? []).length} rows
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-2.5">Order #</th>
                        <th className="text-left px-4 py-2.5">Customer</th>
                        <th className="text-left px-4 py-2.5">Station</th>
                        <th className="text-left px-4 py-2.5">Status</th>
                        <th className="text-left px-4 py-2.5">Rush</th>
                        <th className="text-left px-4 py-2.5">Issues</th>
                        <th className="text-left px-4 py-2.5">Ship Date</th>
                        <th className="text-right px-4 py-2.5">Amount</th>
                        <th className="text-left px-4 py-2.5">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report?.rows ?? []).map((row) => (
                        <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">
                            {row.orderNumber}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">{row.customerName}</td>
                          <td className="px-4 py-2.5 text-slate-600">{row.currentStation}</td>
                          <td className="px-4 py-2.5 text-slate-600">{row.status}</td>
                          <td className="px-4 py-2.5">
                            {row.isRush ? (
                              <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold">
                                Rush
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {row.hasHold || row.hasMissing ? (
                              <div className="flex items-center gap-1.5">
                                {row.hasHold ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold">
                                    Hold
                                  </span>
                                ) : null}
                                {row.hasMissing ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold">
                                    Missing
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-emerald-600 text-xs font-medium">None</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{toDate(row.shipDate)}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-slate-700">
                            {toCurrency(row.saleAmount)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">
                            {toDate(row.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">{title}</p>
        <div className="text-[#005B97]">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function GaugeCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: number;
  subtitle: string;
  tone: "blue" | "rose" | "amber";
}) {
  const colors =
    tone === "rose"
      ? { primary: "#E11D48", bg: "#FFE4E6" }
      : tone === "amber"
        ? { primary: "#D97706", bg: "#FEF3C7" }
        : { primary: "#005B97", bg: "#DBEAFE" };

  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">{title}</p>
      <div className="mt-3 flex items-center gap-4">
        <div
          className="h-20 w-20 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(${colors.primary} ${clamped}%, ${colors.bg} ${clamped}% 100%)`,
          }}
        >
          <div className="h-14 w-14 rounded-full bg-white grid place-items-center">
            <span className="text-sm font-bold text-slate-700">{clamped}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-slate-900">{clamped}%</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <div className="text-[#005B97]">{icon}</div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</h3>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function BarList({
  rows,
  max,
}: {
  rows: Array<{ label: string; value: number }>;
  max: number;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">No data for this filter set.</p>;
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-600 truncate">{row.label}</p>
            <p className="text-xs font-semibold text-slate-700">{row.value}</p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#005B97]"
              style={{
                width: `${Math.max(6, (row.value / max) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
