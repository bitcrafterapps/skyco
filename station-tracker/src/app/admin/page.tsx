"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type {
  Order,
  StationId,
  StatusField,
} from "@/lib/types";
import { STATIONS, STATION_LABELS } from "@/lib/types";
import AdminOrderTable from "@/components/AdminOrderTable";
import AdminSubNav from "@/components/AdminSubNav";
import AppFooter from "@/components/AppFooter";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";
import OrderImportPanel from "@/components/OrderImportPanel";

interface StationOption {
  id: string;
  label: string;
}

const DEFAULT_NEW_ORDER: Partial<Order> = {
  orderNumber: "",
  customerName: "",
  department: "Roller Shade",
  currentStation: "basket",
  status: "Producible",
  isRush: false,
  shipDate: null,
  saleAmount: 0,
  sidemark: "",
  notes: "",
  target: "",
};

const DEFAULT_STATION_OPTIONS: StationOption[] = STATIONS.map((id) => ({
  id,
  label: STATION_LABELS[id],
}));

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stationOptions, setStationOptions] = useState<StationOption[]>(DEFAULT_STATION_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>(DEFAULT_NEW_ORDER);
  const [saving, setSaving] = useState(false);
  const [addOrderError, setAddOrderError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data.data ?? data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStationOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/stations", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const options = Array.isArray(payload?.data)
        ? payload.data
            .map((station: { stationId?: string; label?: string }) => {
              if (!station?.stationId) return null;
              return {
                id: station.stationId,
                label: station.label ?? station.stationId,
              };
            })
            .filter((station: StationOption | null): station is StationOption => Boolean(station))
        : [];

      if (options.length > 0) {
        setStationOptions(options);
      }
    } catch {
      // Keep fallback static options if dynamic load fails
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStationOptions();
  }, [fetchOrders, fetchStationOptions]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const handleDelete = useCallback(
    async (orderId: string) => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchOrders();
      } catch (err) {
        alert(
          `Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    },
    [fetchOrders]
  );

  const handleUpdate = useCallback(
    async (orderId: string, updates: Partial<Order>) => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchOrders();
        return true;
      } catch (err) {
        alert(
          `Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        return false;
      }
    },
    [fetchOrders]
  );

  const handleToggleStatus = useCallback(
    async (orderId: string, stationId: StationId, field: StatusField) => {
      // Find the current value so we can send the toggled value
      const order = orders.find((o) => o.id === orderId);
      const currentValue = order?.stationStatuses?.[stationId]?.[field] ?? false;

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            station: stationId,
            field,
            value: !currentValue,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchOrders();
      } catch (err) {
        alert(
          `Failed to toggle: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    },
    [fetchOrders, orders]
  );

  const handleAddOrder = useCallback(async () => {
    setAddOrderError(null);
    if (!newOrder.orderNumber || !newOrder.customerName) {
      setAddOrderError("Order number and customer name are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) {
          setAddOrderError(
            body?.error ?? "An order with this order number already exists."
          );
          return;
        }
        setAddOrderError(body?.error ?? `Failed to add order (HTTP ${res.status})`);
        return;
      }
      setAddOrderError(null);
      setNewOrder({
        ...DEFAULT_NEW_ORDER,
        currentStation:
          (stationOptions[0]?.id as StationId | undefined) ??
          DEFAULT_NEW_ORDER.currentStation,
      });
      setShowAddForm(false);
      await fetchOrders();
    } catch (err) {
      setAddOrderError(
        err instanceof Error ? err.message : "Failed to add order"
      );
    } finally {
      setSaving(false);
    }
  }, [newOrder, fetchOrders, stationOptions]);

  const handleImportComplete = useCallback(
    async (message: string) => {
      await fetchOrders();
      setToastMessage(message);
    },
    [fetchOrders]
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 admin-selectable">
      {/* Premium header with bevel and radiance */}
      <header
        className="relative px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:py-5"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,91,151,0.06)",
          borderBottom: "1px solid rgba(0,91,151,0.08)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 15% 50%, rgba(0,91,151,0.04) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full md:w-auto min-w-0 md:min-w-[290px]">
            <Link
              href="/"
              className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97] shrink-0"
              style={{
                background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,91,151,0.08)",
              }}
              aria-label="Back to dashboard"
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
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap" style={{ letterSpacing: "-0.02em" }}>
                Admin Panel
              </h1>
              <p className="text-xs text-[#6497B0] font-medium hidden lg:block">Manage production orders</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full md:flex-1 md:min-w-0 justify-start md:justify-end overflow-x-auto overflow-y-visible hide-scrollbar pb-0.5 md:pb-0">
            <ThemeToggle />
            <OrderSearch theme="light" />
            <button
              onClick={() => {
                setShowImportPanel((current) => !current);
                setShowAddForm(false);
                setAddOrderError(null);
              }}
              className="rounded-lg sm:rounded-xl px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium text-[#005B97] transition-all duration-150 ease-out active:scale-[0.97] min-h-[32px] sm:min-h-[40px] md:min-h-[44px] shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/30 border border-[#005B97]/25 bg-white"
            >
              {showImportPanel ? "Hide Import" : "Import Orders"}
            </button>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowImportPanel(false);
                setAddOrderError(null);
              }}
              className="rounded-lg sm:rounded-xl px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium text-white transition-all duration-150 ease-out active:scale-[0.97] min-h-[32px] sm:min-h-[40px] md:min-h-[44px] shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
              style={{
                background: "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
              }}
            >
              {showAddForm ? "Cancel" : "+ Add Order"}
            </button>
          </div>
        </div>
      </header>

      <AdminSubNav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            <p className="font-medium">Error loading orders</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        )}

        {/* Add Order Form */}
        {showAddForm && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">
              Add New Order
            </h2>
            {addOrderError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {addOrderError}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Order Number *
                </label>
                <input
                  type="text"
                  value={newOrder.orderNumber ?? ""}
                  onChange={(e) =>
                    setNewOrder((o) => ({ ...o, orderNumber: e.target.value }))
                  }
                  placeholder="e.g., 200001"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newOrder.customerName ?? ""}
                  onChange={(e) =>
                    setNewOrder((o) => ({
                      ...o,
                      customerName: e.target.value,
                    }))
                  }
                  placeholder="e.g., DESERT WINDOW TREATMENTS"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={newOrder.department ?? ""}
                  onChange={(e) =>
                    setNewOrder((o) => ({ ...o, department: e.target.value }))
                  }
                  placeholder="e.g., Roller Shade"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Station
                </label>
                <select
                  value={newOrder.currentStation ?? stationOptions[0]?.id ?? "basket"}
                  onChange={(e) =>
                    setNewOrder((o) => ({
                      ...o,
                      currentStation: e.target.value as StationId,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                >
                  {stationOptions.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ship Date
                </label>
                <input
                  type="date"
                  value={newOrder.shipDate ?? ""}
                  onChange={(e) =>
                    setNewOrder((o) => ({
                      ...o,
                      shipDate: e.target.value || null,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Sidemark
                </label>
                <input
                  type="text"
                  value={newOrder.sidemark ?? ""}
                  onChange={(e) =>
                    setNewOrder((o) => ({ ...o, sidemark: e.target.value }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2.5 cursor-pointer py-2.5">
                  <input
                    type="checkbox"
                    checked={newOrder.isRush ?? false}
                    onChange={(e) =>
                      setNewOrder((o) => ({ ...o, isRush: e.target.checked }))
                    }
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#005B97] focus:ring-[#005B97]"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Rush Order
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={newOrder.notes ?? ""}
                  onChange={(e) =>
                    setNewOrder((o) => ({ ...o, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleAddOrder}
                disabled={saving}
                className="rounded-lg bg-[#005B97] px-6 py-2.5 text-sm font-medium text-white active:bg-[#004A7C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                {saving ? "Adding..." : "Add Order"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setAddOrderError(null);
                  setNewOrder({
                    ...DEFAULT_NEW_ORDER,
                    currentStation:
                      (stationOptions[0]?.id as StationId | undefined) ??
                      DEFAULT_NEW_ORDER.currentStation,
                  });
                }}
                className="rounded-lg bg-slate-100 border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 active:bg-slate-200 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showImportPanel && (
          <OrderImportPanel
            onImportComplete={handleImportComplete}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <svg
              className="h-8 w-8 animate-spin text-[#005B97] mr-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading orders...
          </div>
        )}

        {/* Order Table */}
        {!loading && (
          <AdminOrderTable
            orders={orders}
            stationOptions={stationOptions}
            onRefresh={fetchOrders}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onSaveSuccess={setToastMessage}
            onToggleStatus={handleToggleStatus}
          />
        )}
        </div>
      </main>

      {toastMessage && (
        <div className="fixed right-4 top-4 z-10000">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
