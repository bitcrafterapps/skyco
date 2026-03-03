"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  Order,
  StationId,
  OrderStatus,
  StatusField,
  OrderNoteEntry,
} from "@/lib/types";
import {
  STATION_LABELS,
  parseOrderNotes,
  serializeOrderNotes,
  formatNoteTimestamp,
} from "@/lib/types";
import { useDoneAutoAdvance } from "@/hooks/useDoneAutoAdvance";

interface AdminOrderTableProps {
  orders: Order[];
  stationOptions: Array<{ id: string; label: string }>;
  onRefresh: () => Promise<void>;
  onDelete: (orderId: string) => void;
  onUpdate: (orderId: string, updates: Partial<Order>) => Promise<boolean>;
  onSaveSuccess?: (message: string) => void;
  onToggleStatus: (
    orderId: string,
    stationId: StationId,
    field: StatusField
  ) => Promise<void> | void;
}

const ORDER_STATUSES: OrderStatus[] = [
  "Producible",
  "Missing Parts",
  "Complete",
  "Complete But M/P",
  "Scheduling",
  "Credit Hold",
  "Sch + M/P",
  "Tag Team",
  "Sale Order",
  "Production Order",
  "Approved for Production",
  "Print Hold",
  "Production Order Printed",
  "Production Label",
  "Will Call",
  "Full Packed",
  "Part Packed",
  "Invoiced",
  "Invoiced (Balance Due)",
];

type SortKey =
  | "orderNumber"
  | "customerName"
  | "currentStation"
  | "status"
  | "isRush"
  | "shipDate"
  | "sidemark"
  | "notes"
  | "done"
  | "hold"
  | "missing";

const SORT_STORAGE_KEY = "admin-order-table-sort";
const FILTER_STORAGE_KEY = "admin-order-table-filters";
const SORT_KEYS: SortKey[] = [
  "orderNumber",
  "customerName",
  "currentStation",
  "status",
  "isRush",
  "shipDate",
  "sidemark",
  "notes",
  "done",
  "hold",
  "missing",
];
const FILTER_STATUS_VALUES = ["all", "rush", "hold", "missing"] as const;
type FilterStatusValue = (typeof FILTER_STATUS_VALUES)[number];

export default function AdminOrderTable({
  orders,
  stationOptions,
  onRefresh,
  onDelete,
  onUpdate,
  onSaveSuccess,
  onToggleStatus,
}: AdminOrderTableProps) {
  const { scheduleAdvance, cancelAdvance } = useDoneAutoAdvance(onRefresh);
  const [filterStation, setFilterStation] = useState<string>(() => {
    if (typeof window === "undefined") return "all";
    try {
      const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return "all";
      const parsed = JSON.parse(raw) as { station?: string };
      if (typeof parsed.station === "string" && parsed.station.trim()) {
        return parsed.station;
      }
    } catch {
      // Ignore invalid stored filter values
    }
    return "all";
  });
  const [filterStatus, setFilterStatus] = useState<FilterStatusValue>(() => {
    if (typeof window === "undefined") return "all";
    try {
      const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return "all";
      const parsed = JSON.parse(raw) as { status?: string };
      if (
        typeof parsed.status === "string" &&
        FILTER_STATUS_VALUES.includes(parsed.status as FilterStatusValue)
      ) {
        return parsed.status as FilterStatusValue;
      }
    } catch {
      // Ignore invalid stored filter values
    }
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { search?: string };
      if (typeof parsed.search === "string") {
        return parsed.search;
      }
    } catch {
      // Ignore invalid stored filter values
    }
    return "";
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [pendingStatusByRow, setPendingStatusByRow] = useState<
    Record<string, Partial<Record<StatusField, boolean>>>
  >({});
  
  // Notes Modal state
  const [activeNotesOrder, setActiveNotesOrder] = useState<Order | null>(null);
  const [noteSortDirection, setNoteSortDirection] = useState<"asc" | "desc">("desc");
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const activeNotes = useMemo(() => {
    return activeNotesOrder ? parseOrderNotes(activeNotesOrder) : [];
  }, [activeNotesOrder]);

  const sortedNotes = useMemo(() => {
    const rows = [...activeNotes];
    rows.sort((a, b) => {
      const aTs = new Date(a.createdAt).getTime();
      const bTs = new Date(b.createdAt).getTime();
      return noteSortDirection === "asc" ? aTs - bTs : bTs - aTs;
    });
    return rows;
  }, [noteSortDirection, activeNotes]);

  const persistNotes = useCallback(
    async (nextNotes: OrderNoteEntry[]) => {
      if (!activeNotesOrder) return;
      setIsSavingNotes(true);
      setNotesError(null);
      try {
        const success = await onUpdate(activeNotesOrder.id, {
          notes: serializeOrderNotes(nextNotes),
        });
        if (success) {
          onSaveSuccess?.(`Notes updated for Order #${activeNotesOrder.orderNumber}`);
          // Close modal on save success
          setActiveNotesOrder(null);
          onRefresh();
        } else {
          setNotesError("Failed to save notes");
        }
      } catch (err) {
        setNotesError(err instanceof Error ? err.message : "Failed to save notes");
      } finally {
        setIsSavingNotes(false);
      }
    },
    [activeNotesOrder, onUpdate, onSaveSuccess, onRefresh]
  );
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>(() => {
    if (typeof window === "undefined") {
      return { key: "orderNumber", direction: "asc" };
    }
    try {
      const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
      if (!raw) return { key: "orderNumber", direction: "asc" };
      const parsed = JSON.parse(raw) as {
        key?: SortKey;
        direction?: "asc" | "desc";
      };
      if (
        parsed.key &&
        SORT_KEYS.includes(parsed.key) &&
        (parsed.direction === "asc" || parsed.direction === "desc")
      ) {
        return { key: parsed.key, direction: parsed.direction };
      }
    } catch {
      // Ignore invalid stored sort values
    }
    return { key: "orderNumber", direction: "asc" };
  });

  useEffect(() => {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    window.localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({
        station: filterStation,
        status: filterStatus,
        search: searchQuery,
      })
    );
  }, [filterStation, filterStatus, searchQuery]);

  const stationLabelById = useMemo(() => {
    const dynamicLabels = stationOptions.reduce<Record<string, string>>(
      (acc, station) => {
        acc[station.id] = station.label;
        return acc;
      },
      {}
    );
    return {
      ...(STATION_LABELS as unknown as Record<string, string>),
      ...dynamicLabels,
    };
  }, [stationOptions]);

  const allStationOptions = useMemo(() => {
    const merged = new Map<string, string>();
    stationOptions.forEach((station) => merged.set(station.id, station.label));
    orders.forEach((order) => {
      if (!merged.has(order.currentStation)) {
        merged.set(
          order.currentStation,
          stationLabelById[order.currentStation] ?? order.currentStation
        );
      }
    });
    return Array.from(merged.entries()).map(([id, label]) => ({ id, label }));
  }, [orders, stationLabelById, stationOptions]);

  const filtered = orders.filter((order) => {
    if (filterStation !== "all" && order.currentStation !== filterStation) {
      return false;
    }
    if (filterStatus === "rush" && !order.isRush) return false;
    if (filterStatus === "hold") {
      const hasHold = Object.values(order.stationStatuses || {}).some(
        (s) => s.hold
      );
      if (!hasHold) return false;
    }
    if (filterStatus === "missing") {
      const hasMissing = Object.values(order.stationStatuses || {}).some(
        (s) => s.missing
      );
      if (!hasMissing) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.sidemark?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Keep ref synced
  const editStateRef = useRef({
    editingId,
    editForm,
    pendingStatusByRow,
    orders,
    onUpdate,
    onToggleStatus,
    scheduleAdvance,
    cancelAdvance,
    onSaveSuccess
  });

  useEffect(() => {
    editStateRef.current = {
      editingId,
      editForm,
      pendingStatusByRow,
      orders,
      onUpdate,
      onToggleStatus,
      scheduleAdvance,
      cancelAdvance,
      onSaveSuccess
    };
  }, [editingId, editForm, pendingStatusByRow, orders, onUpdate, onToggleStatus, scheduleAdvance, cancelAdvance, onSaveSuccess]);

  // Handle auto-save when clicking outside the editing row
  useEffect(() => {
    const handleGlobalClick = async (e: MouseEvent) => {
      const { editingId, editForm, pendingStatusByRow, orders, onUpdate, onToggleStatus, scheduleAdvance, cancelAdvance, onSaveSuccess } = editStateRef.current;
      if (!editingId) return;

      const target = e.target as HTMLElement;
      // If clicking inside the currently edited row or a modal, do nothing
      if (target.closest(`tr[data-order-id="${editingId}"]`)) return;
      if (target.closest('.fixed.inset-0.z-\\[100\\]')) return; 

      const order = orders.find(o => o.id === editingId);
      if (!order) return;

      const pending = pendingStatusByRow[editingId] ?? {};
      
      let hasChanges = false;
      if (editForm.orderNumber !== undefined && editForm.orderNumber !== order.orderNumber) hasChanges = true;
      if (editForm.customerName !== undefined && editForm.customerName !== order.customerName) hasChanges = true;
      if (editForm.currentStation !== undefined && editForm.currentStation !== order.currentStation) hasChanges = true;
      if (editForm.status !== undefined && editForm.status !== order.status) hasChanges = true;
      if (editForm.isRush !== undefined && editForm.isRush !== order.isRush) hasChanges = true;
      if (editForm.shipDate !== undefined && editForm.shipDate !== order.shipDate) hasChanges = true;
      if (editForm.sidemark !== undefined && editForm.sidemark !== order.sidemark) hasChanges = true;
      
      const fields: StatusField[] = ["done", "hold", "missing"];
      for (const field of fields) {
        if (typeof pending[field] === "boolean") {
          const currentValue = Boolean(order.stationStatuses?.[order.currentStation]?.[field]);
          if (pending[field] !== currentValue) hasChanges = true;
        }
      }

      if (hasChanges) {
        // Optimistically clear the editing state
        setEditingId((current) => current === editingId ? null : current);
        setEditForm((current) => current === editForm ? {} : current);
        setPendingStatusByRow((current) => {
          const next = { ...current };
          delete next[editingId];
          return next;
        });

        const didSave = await onUpdate(editingId, editForm);
        if (didSave) {
          for (const field of fields) {
            if (typeof pending[field] !== "boolean") continue;
            const currentValue = Boolean(order.stationStatuses?.[order.currentStation]?.[field]);
            if (pending[field] !== currentValue) {
              await onToggleStatus(order.id, order.currentStation, field);
              if (field === "done") {
                const stationId = (editForm.currentStation as string) ?? order.currentStation;
                if (pending[field]) {
                  scheduleAdvance(order.id, stationId);
                } else {
                  cancelAdvance(order.id);
                }
              }
            }
          }
          onSaveSuccess?.(`Order #${editForm.orderNumber ?? order.orderNumber} saved automatically`);
        }
      } else {
        // No changes, just cancel edit
        setEditingId((current) => current === editingId ? null : current);
        setEditForm((current) => current === editForm ? {} : current);
        setPendingStatusByRow((current) => {
          const next = { ...current };
          delete next[editingId];
          return next;
        });
      }
    };
    
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  const startEdit = useCallback((order: Order) => {
    setEditingId(order.id);
    setEditForm({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      department: order.department,
      currentStation: order.currentStation,
      status: order.status,
      isRush: order.isRush,
      shipDate: order.shipDate,
      sidemark: order.sidemark,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    if (editingId) {
      setPendingStatusByRow((current) => {
        const next = { ...current };
        delete next[editingId];
        return next;
      });
    }
    setEditingId(null);
    setEditForm({});
  }, [editingId]);

  const getEffectiveStatus = useCallback(
    (order: Order, field: StatusField): boolean => {
      const pending = pendingStatusByRow[order.id]?.[field];
      if (typeof pending === "boolean") return pending;
      return Boolean(order.stationStatuses?.[order.currentStation]?.[field]);
    },
    [pendingStatusByRow]
  );

  const togglePendingStatus = useCallback(
    (order: Order, field: StatusField) => {
      if (editingId !== order.id) {
        startEdit(order);
      }
      setPendingStatusByRow((current) => {
        const rowPending = current[order.id] ?? {};
        const currentValue =
          typeof rowPending[field] === "boolean"
            ? Boolean(rowPending[field])
            : Boolean(order.stationStatuses?.[order.currentStation]?.[field]);
        return {
          ...current,
          [order.id]: {
            ...rowPending,
            [field]: !currentValue,
          },
        };
      });
    },
    [editingId, startEdit]
  );

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    const order = orders.find((o) => o.id === editingId);
    if (!order) return;
    setSavingId(editingId);
    const didSave = await onUpdate(editingId, editForm);
    setSavingId(null);
    if (didSave) {
      const pending = pendingStatusByRow[editingId] ?? {};
      const fields: StatusField[] = ["done", "hold", "missing"];
      for (const field of fields) {
        if (typeof pending[field] !== "boolean") continue;
        const currentValue = Boolean(
          order.stationStatuses?.[order.currentStation]?.[field]
        );
        if (pending[field] !== currentValue) {
          await onToggleStatus(order.id, order.currentStation, field);

          // Schedule or cancel auto-advance when done is toggled
          if (field === "done") {
            const stationId =
              (editForm.currentStation as string) ?? order.currentStation;
            if (pending[field]) {
              scheduleAdvance(order.id, stationId);
            } else {
              cancelAdvance(order.id);
            }
          }
        }
      }

      setPendingStatusByRow((current) => {
        const next = { ...current };
        delete next[editingId];
        return next;
      });
      onSaveSuccess?.(
        `Order #${editForm.orderNumber ?? order.orderNumber} saved successfully`
      );
      setEditingId(null);
      setEditForm({});
    }
  }, [editingId, editForm, onSaveSuccess, onToggleStatus, onUpdate, orders, pendingStatusByRow, scheduleAdvance, cancelAdvance]);

  const getSortValue = useCallback((order: Order, key: SortKey): string | number => {
    const stationStatus = order.stationStatuses?.[order.currentStation];
    switch (key) {
      case "orderNumber":
        return order.orderNumber ?? "";
      case "customerName":
        return order.customerName ?? "";
      case "currentStation":
        return stationLabelById[order.currentStation] ?? order.currentStation;
      case "status":
        return order.status ?? "";
      case "isRush":
        return order.isRush ? 1 : 0;
      case "shipDate":
        return order.shipDate ?? "";
      case "sidemark":
        return order.sidemark ?? "";
      case "notes":
        return parseOrderNotes(order).length;
      case "done":
        return stationStatus?.done ? 1 : 0;
      case "hold":
        return stationStatus?.hold ? 1 : 0;
      case "missing":
        return stationStatus?.missing ? 1 : 0;
      default:
        return "";
    }
  }, [stationLabelById]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);

      let comparison = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
    return rows;
  }, [filtered, getSortValue, sortConfig]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const sortIcon = useCallback(
    (key: SortKey) => {
      if (sortConfig.key !== key) return "↕";
      return sortConfig.direction === "asc" ? "↑" : "↓";
    },
    [sortConfig]
  );

  return (
    <div className="admin-selectable">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-100 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Station:</label>
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]"
          >
            <option value="all">All Stations</option>
            {allStationOptions.map((station) => (
              <option key={station.id} value={station.id}>
                {station.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatusValue)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]"
          >
            <option value="all">All Orders</option>
            <option value="rush">Rush Only</option>
            <option value="hold">On Hold</option>
            <option value="missing">Missing Parts</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Search:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order #, customer, sidemark..."
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97] w-64"
          />
        </div>

        <button
          onClick={async () => {
            setRefreshing(true);
            try {
              await onRefresh();
            } finally {
              setRefreshing(false);
            }
          }}
          disabled={refreshing}
          className="ml-auto rounded-md bg-[#005B97] px-4 py-1.5 text-sm font-medium text-white active:bg-[#004A7C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Count */}
      <p className="text-sm text-slate-500 mb-2">
        Showing {filtered.length} of {orders.length} orders
      </p>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-[84px] py-3 px-3 text-left font-semibold text-slate-700">
                <button onClick={() => toggleSort("orderNumber")} className="inline-flex items-center gap-1 cursor-pointer">
                  Order # <span className="text-slate-400">{sortIcon("orderNumber")}</span>
                </button>
              </th>
              <th className="w-[170px] py-3 px-3 text-left font-semibold text-slate-700">
                <button onClick={() => toggleSort("customerName")} className="inline-flex items-center gap-1 cursor-pointer">
                  Customer <span className="text-slate-400">{sortIcon("customerName")}</span>
                </button>
              </th>
              <th className="w-[110px] py-3 px-3 text-left font-semibold text-slate-700">
                <button onClick={() => toggleSort("currentStation")} className="inline-flex items-center gap-1 cursor-pointer">
                  Station <span className="text-slate-400">{sortIcon("currentStation")}</span>
                </button>
              </th>
              <th className="w-[130px] py-3 px-3 text-left font-semibold text-slate-700">
                <button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 cursor-pointer">
                  Status <span className="text-slate-400">{sortIcon("status")}</span>
                </button>
              </th>
              <th className="w-[62px] py-3 px-2 text-center font-semibold text-slate-700">
                <button onClick={() => toggleSort("isRush")} className="inline-flex items-center gap-1 cursor-pointer">
                  Rush <span className="text-slate-400">{sortIcon("isRush")}</span>
                </button>
              </th>
              <th className="w-[110px] py-3 px-3 text-left font-semibold text-slate-700">
                <button onClick={() => toggleSort("shipDate")} className="inline-flex items-center gap-1 cursor-pointer">
                  Ship Date <span className="text-slate-400">{sortIcon("shipDate")}</span>
                </button>
              </th>
              <th className="w-[120px] py-3 px-3 text-left font-semibold text-slate-700">
                <button onClick={() => toggleSort("sidemark")} className="inline-flex items-center gap-1 cursor-pointer">
                  Sidemark <span className="text-slate-400">{sortIcon("sidemark")}</span>
                </button>
              </th>
              <th className="w-[130px] py-3 px-3 text-left font-semibold text-slate-700">
                <button onClick={() => toggleSort("notes")} className="inline-flex items-center gap-1 cursor-pointer">
                  Notes <span className="text-slate-400">{sortIcon("notes")}</span>
                </button>
              </th>
              <th className="w-[56px] py-3 px-2 text-center font-semibold text-slate-700">
                <button onClick={() => toggleSort("done")} className="inline-flex items-center gap-1 cursor-pointer">
                  Done <span className="text-slate-400">{sortIcon("done")}</span>
                </button>
              </th>
              <th className="w-[56px] py-3 px-2 text-center font-semibold text-slate-700">
                <button onClick={() => toggleSort("hold")} className="inline-flex items-center gap-1 cursor-pointer">
                  Hold <span className="text-slate-400">{sortIcon("hold")}</span>
                </button>
              </th>
              <th className="w-[56px] py-3 px-2 text-center font-semibold text-slate-700">
                <button onClick={() => toggleSort("missing")} className="inline-flex items-center gap-1 cursor-pointer">
                  Missing <span className="text-slate-400">{sortIcon("missing")}</span>
                </button>
              </th>
              <th className="w-[128px] py-3 px-3 text-right font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((order) => {
              const isEditing = editingId === order.id;

              return (
                <tr
                  key={order.id}
                  data-order-id={order.id}
                  className={`border-b border-slate-100 ${
                    isEditing ? "bg-[#005B97]/5" : "hover:bg-slate-50"
                  } ${order.isRush ? "bg-red-50/50" : ""}`}
                >
                  {/* Order # */}
                  <td
                    className={`py-2 px-3 font-mono font-bold text-slate-900 ${
                      isEditing ? "" : "cursor-text"
                    }`}
                    onClick={() => {
                      if (!isEditing) startEdit(order);
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.orderNumber ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            orderNumber: e.target.value,
                          }))
                        }
                        className="w-full min-w-0 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      order.orderNumber
                    )}
                  </td>

                  {/* Customer */}
                  <td
                    className={`py-2 px-3 text-slate-700 truncate ${
                      isEditing ? "" : "cursor-text"
                    }`}
                    onClick={() => {
                      if (!isEditing) startEdit(order);
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.customerName ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            customerName: e.target.value,
                          }))
                        }
                        className="w-full min-w-0 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      order.customerName
                    )}
                  </td>

                  {/* Station */}
                  <td
                    className={`py-2 px-3 text-slate-700 ${
                      isEditing ? "" : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isEditing) startEdit(order);
                    }}
                  >
                    {isEditing ? (
                      <select
                        value={
                          (editForm.currentStation as string) ??
                          order.currentStation
                        }
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            currentStation: e.target.value as StationId,
                          }))
                        }
                        className="w-full min-w-0 rounded border border-slate-300 px-2 py-1 text-sm"
                      >
                        {allStationOptions.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      stationLabelById[order.currentStation] ||
                      order.currentStation
                    )}
                  </td>

                  {/* Status */}
                  <td
                    className={`py-2 px-3 text-slate-700 ${
                      isEditing ? "" : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isEditing) startEdit(order);
                    }}
                  >
                    {isEditing ? (
                      <select
                        value={(editForm.status as string) ?? order.status}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            status: e.target.value as OrderStatus,
                          }))
                        }
                        className="w-full min-w-0 rounded border border-slate-300 px-2 py-1 text-sm"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs">{order.status}</span>
                    )}
                  </td>

                  {/* Rush */}
                  <td
                    className={`py-2 px-2 text-center ${
                      isEditing ? "" : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isEditing) startEdit(order);
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={editForm.isRush ?? false}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            isRush: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    ) : order.isRush ? (
                      <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        RUSH
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>

                  {/* Ship Date */}
                  <td
                    className={`py-2 px-3 text-slate-600 text-xs ${
                      isEditing ? "" : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isEditing) startEdit(order);
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.shipDate ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            shipDate: e.target.value || null,
                          }))
                        }
                        className="w-full min-w-0 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      order.shipDate ?? "-"
                    )}
                  </td>

                  {/* Sidemark */}
                  <td
                    className={`py-2 px-3 text-slate-600 text-xs truncate ${
                      isEditing ? "" : "cursor-text"
                    }`}
                    onClick={() => {
                      if (!isEditing) startEdit(order);
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.sidemark ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            sidemark: e.target.value,
                          }))
                        }
                        className="w-full min-w-0 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      order.sidemark || "-"
                    )}
                  </td>

                  {/* Notes */}
                  <td className={`py-2 px-3 text-slate-600 text-xs ${isEditing ? "" : "cursor-pointer"}`}>
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNotesOrder(order);
                          setNewNoteText("");
                          setEditingNoteId(null);
                        }}
                        className="w-full rounded bg-slate-100 border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-200"
                      >
                        Edit Notes
                      </button>
                    ) : (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNotesOrder(order);
                          setNewNoteText("");
                          setEditingNoteId(null);
                        }}
                        className="flex items-center gap-1.5 hover:text-[#005B97] transition-colors rounded px-1.5 py-1 -ml-1.5 hover:bg-slate-100"
                      >
                        <svg className={`h-4 w-4 shrink-0 ${parseOrderNotes(order).length > 0 ? "text-amber-500" : "text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {parseOrderNotes(order).length > 0 ? (
                          <span className="truncate max-w-[80px]">{parseOrderNotes(order).length} note{parseOrderNotes(order).length === 1 ? "" : "s"}</span>
                        ) : (
                          <span className="text-slate-400 italic">Add...</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Station status toggles */}
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => togglePendingStatus(order, "done")}
                      className={`h-7 w-7 rounded ${
                        getEffectiveStatus(order, "done")
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-400"
                      } transition-colors`}
                      title="Toggle done"
                    >
                      {getEffectiveStatus(order, "done") ? (
                        <svg className="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => togglePendingStatus(order, "hold")}
                      className={`h-7 w-7 rounded ${
                        getEffectiveStatus(order, "hold")
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 text-slate-400"
                      } transition-colors`}
                      title="Toggle hold"
                    >
                      {getEffectiveStatus(order, "hold") ? (
                        <svg className="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => togglePendingStatus(order, "missing")}
                      className={`h-7 w-7 rounded ${
                        getEffectiveStatus(order, "missing")
                          ? "bg-amber-500 text-white"
                          : "bg-slate-200 text-slate-400"
                      } transition-colors`}
                      title="Toggle missing"
                    >
                      {getEffectiveStatus(order, "missing") ? (
                        <svg className="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={savingId === order.id}
                          className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white active:bg-emerald-700 transition-colors"
                        >
                          {savingId === order.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={savingId === order.id}
                          className="rounded bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 active:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete order ${order.orderNumber}?`
                              )
                            ) {
                              onDelete(order.id);
                            }
                          }}
                          className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            No orders match the current filters.
          </div>
        )}
      </div>

      {activeNotesOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-800">
              <h3 className="font-bold text-lg">
                Notes
                <span className="font-mono text-[#005B97] ml-2">#{activeNotesOrder.orderNumber}</span>
              </h3>
              <button
                onClick={() => setActiveNotesOrder(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors p-2 -mr-2"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar flex-1">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  {sortedNotes.length} note{sortedNotes.length === 1 ? "" : "s"}
                </p>
                {sortedNotes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setNoteSortDirection((v) => (v === "asc" ? "desc" : "asc"))}
                    className="text-xs text-[#005B97] hover:text-[#004A7C] font-medium transition-colors"
                  >
                    {noteSortDirection === "asc" ? "Oldest ▾" : "Newest ▾"}
                  </button>
                )}
              </div>

              {sortedNotes.length === 0 ? (
                <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-sm text-slate-400">No notes yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedNotes.map((note) => {
                    const isEditing = editingNoteId === note.id;
                    return (
                      <div
                        key={note.id}
                        className={`rounded-xl border ${isEditing ? "border-[#005B97]" : "border-slate-200"} bg-white p-4 shadow-sm transition-colors`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                            {formatNoteTimestamp(note.updatedAt ?? note.createdAt)}
                            {note.updatedAt ? " (edited)" : ""}
                          </span>
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteText(note.text);
                                setNotesError(null);
                              }}
                              className="text-xs text-[#005B97] hover:text-[#004A7C] underline font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 pt-1">
                            <textarea
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#005B97] focus:ring-1 focus:ring-[#005B97] outline-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingNoteText("");
                                }}
                                disabled={isSavingNotes}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editingNoteId || isSavingNotes) return;
                                  const text = editingNoteText.trim();
                                  if (!text) return;
                                  const timestamp = new Date().toISOString();
                                  const nextNotes = activeNotes.map((n) =>
                                    n.id === editingNoteId ? { ...n, text, updatedAt: timestamp } : n
                                  );
                                  setEditingNoteId(null);
                                  setEditingNoteText("");
                                  persistNotes(nextNotes);
                                }}
                                disabled={isSavingNotes || !editingNoteText.trim()}
                                className="rounded-lg bg-[#005B97] hover:bg-[#004A7C] px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                              >
                                {isSavingNotes ? "Saving..." : "Save Edit"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {note.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="space-y-3">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Type a new note here..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#005B97] focus:ring-1 focus:ring-[#005B97] resize-none outline-none shadow-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 hidden sm:inline-block">
                    Adds a timestamp automatically.
                  </span>
                  {notesError && <span className="text-xs text-red-500 max-w-[200px] truncate">{notesError}</span>}
                  
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => setActiveNotesOrder(null)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      disabled={isSavingNotes}
                    >
                      Done
                    </button>
                    <button
                      disabled={isSavingNotes || !newNoteText.trim()}
                      onClick={() => {
                        const text = newNoteText.trim();
                        if (!text || isSavingNotes) return;
                        const timestamp = new Date().toISOString();
                        const nextNotes: OrderNoteEntry[] = [
                          ...activeNotes,
                          {
                            id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                            text,
                            createdAt: timestamp,
                          },
                        ];
                        setNewNoteText("");
                        persistNotes(nextNotes);
                      }}
                      className="rounded-lg bg-[#005B97] px-4 py-2 text-sm font-bold text-white hover:bg-[#004A7C] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                      {isSavingNotes && (
                        <svg className="animate-spin -ml-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isSavingNotes ? "Saving..." : "Add Note"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
