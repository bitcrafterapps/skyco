"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AdminSubNav from "@/components/AdminSubNav";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";

interface Station {
  id: string;
  label: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toStationIdFromDragId(value: string | number): string {
  return String(value).replace(/^(m|d)-/, "");
}

function SortableStationItem({
  id,
  disabled,
  className,
  children,
}: {
  id: string;
  disabled?: boolean;
  className: string;
  children: (props: {
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
    isDragging: boolean;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandleProps = disabled
    ? ({} as React.HTMLAttributes<HTMLButtonElement>)
    : ({
        ...attributes,
        ...listeners,
      } as React.HTMLAttributes<HTMLButtonElement>);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? "z-10 ring-2 ring-[#005B97]/20 shadow-lg" : ""}`}
    >
      {children({ dragHandleProps, isDragging })}
    </div>
  );
}

export default function StationsManagementPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add station form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Order counts per station (to determine if delete is allowed)
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch("/api/stations/manage");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStations(data.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stations");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderCounts = useCallback(async () => {
    try {
      // Fetch station summaries to get order counts
      const res = await fetch("/api/stations");
      if (!res.ok) return;
      const data = await res.json();
      const counts: Record<string, number> = {};
      if (data.data && Array.isArray(data.data)) {
        for (const s of data.data) {
          counts[s.stationId] = s.totalOrders ?? 0;
        }
      }
      setOrderCounts(counts);
    } catch {
      // Non-critical, ignore
    }
  }, []);

  useEffect(() => {
    fetchStations();
    fetchOrderCounts();
  }, [fetchStations, fetchOrderCounts]);

  const handleAddStation = useCallback(async () => {
    if (!newLabel.trim()) {
      alert("Station label is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/stations/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel.trim(),
          description: newDescription.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setNewLabel("");
      setNewDescription("");
      setShowAddForm(false);
      await fetchStations();
    } catch (err) {
      alert(
        `Failed to add station: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setSaving(false);
    }
  }, [newLabel, newDescription, fetchStations]);

  const handleUpdate = useCallback(
    async (stationId: string, updates: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/stations/manage/${stationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        await fetchStations();
      } catch (err) {
        alert(
          `Failed to update station: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    },
    [fetchStations]
  );

  const handleSaveEdit = useCallback(
    async (stationId: string) => {
      await handleUpdate(stationId, {
        label: editLabel.trim(),
        description: editDescription.trim(),
      });
      setEditingId(null);
    },
    [editLabel, editDescription, handleUpdate]
  );

  const handleToggleActive = useCallback(
    async (station: Station) => {
      await handleUpdate(station.id, { is_active: !station.isActive });
    },
    [handleUpdate]
  );

  const handleDelete = useCallback(
    async (stationId: string) => {
      try {
        const res = await fetch(`/api/stations/manage/${stationId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        setConfirmDeleteId(null);
        await fetchStations();
      } catch (err) {
        alert(
          `Failed to delete station: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setConfirmDeleteId(null);
      }
    },
    [fetchStations]
  );

  const startEditing = (station: Station) => {
    setEditingId(station.id);
    setEditLabel(station.label);
    setEditDescription(station.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditLabel("");
    setEditDescription("");
  };

  const slugPreview = newLabel
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 180,
      tolerance: 5,
    },
  });
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const sensors = useSensors(touchSensor, pointerSensor);

  const persistStationOrder = useCallback(
    async (stationIds: string[]) => {
      setReordering(true);
      try {
        const res = await fetch("/api/stations/manage/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stationIds }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
      } catch (err) {
        alert(
          `Failed to reorder stations: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        await fetchStations();
      } finally {
        setReordering(false);
      }
    },
    [fetchStations]
  );

  const handleStationDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (editingId || reordering) return;

      const { active, over } = event;
      if (!over) return;

      const activeStationId = toStationIdFromDragId(active.id);
      const overStationId = toStationIdFromDragId(over.id);
      if (activeStationId === overStationId) return;

      setStations((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === activeStationId);
        const newIndex = prev.findIndex((s) => s.id === overStationId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const next = arrayMove(prev, oldIndex, newIndex).map((station, index) => ({
          ...station,
          sortOrder: index,
        }));
        void persistStationOrder(next.map((station) => station.id));
        return next;
      });
    },
    [editingId, reordering, persistStationOrder]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Premium header with bevel and radiance */}
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
            <SmartLogoLink alt="Skyco" imgClassName="h-7 sm:h-8 md:h-10 w-auto shrink-0" />
            <div className="h-6 sm:h-7 md:h-8 w-px bg-slate-200 shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap" style={{ letterSpacing: "-0.02em" }}>
                Station Management
              </h1>
              <p className="text-xs text-[#6497B0] font-medium hidden lg:block">
                Configure production stations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full md:flex-1 md:min-w-0 justify-start md:justify-end overflow-x-auto overflow-y-visible hide-scrollbar pb-0.5 md:pb-0">
            <ThemeToggle />
            <OrderSearch theme="light" />
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-lg sm:rounded-xl px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium text-white transition-all duration-150 ease-out active:scale-[0.97] min-h-[32px] sm:min-h-[40px] md:min-h-[44px] shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
              style={{
                background:
                  "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
              }}
            >
              {showAddForm ? "Cancel" : "+ Add Station"}
            </button>
          </div>
        </div>
      </header>
      <AdminSubNav />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            <p className="font-medium">Error loading stations</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        )}

        {/* Add Station Form */}
        {showAddForm && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">
              Add New Station
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Station Label *
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Quality Check"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
                {newLabel.trim() && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    ID (slug): <span className="font-mono text-slate-700">{slugPreview}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Final quality inspection"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={handleAddStation}
                disabled={saving}
                className="w-full sm:w-auto rounded-xl bg-[#005B97] px-6 py-2.5 text-sm font-medium text-white active:bg-[#004A7C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                {saving ? "Adding..." : "Add Station"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLabel("");
                  setNewDescription("");
                }}
                className="w-full sm:w-auto rounded-xl bg-slate-100 border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 active:bg-slate-200 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
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
            Loading stations...
          </div>
        )}

        {/* Stations List (mobile cards + desktop table) */}
        {!loading && stations.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleStationDragEnd}
          >
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Drag stations to reorder dashboard display</span>
              {reordering ? <span className="font-medium text-[#005B97]">Saving order...</span> : null}
            </div>

            <div className="md:hidden space-y-3">
              <SortableContext
                items={stations.map((station) => `m-${station.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {stations.map((station) => {
                  const isEditing = editingId === station.id;
                  const hasOrders = (orderCounts[station.id] ?? 0) > 0;
                  const isConfirmingDelete = confirmDeleteId === station.id;

                  return (
                    <SortableStationItem
                      key={station.id}
                      id={`m-${station.id}`}
                      disabled={Boolean(editingId) || reordering}
                      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${
                        !station.isActive ? "opacity-75" : ""
                      }`}
                    >
                      {({ dragHandleProps }) => (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Drag to reorder ${station.label}`}
                                title="Drag to reorder"
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 ${
                                  editingId || reordering
                                    ? "cursor-not-allowed opacity-50"
                                    : "cursor-grab active:cursor-grabbing"
                                }`}
                                {...dragHandleProps}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
                                </svg>
                              </button>
                              <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {station.id}
                              </span>
                            </div>
                            <span className="inline-flex items-center justify-center h-7 min-w-7 rounded-full bg-slate-100 text-xs font-medium text-slate-600 px-2">
                              {station.sortOrder}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={editLabel}
                                  onChange={(e) => setEditLabel(e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                                  placeholder="Station label"
                                />
                                <input
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                                  placeholder="Description"
                                />
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-slate-900">{station.label}</p>
                                <p className="text-sm text-slate-500">{station.description || "--"}</p>
                              </>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                              Orders:{" "}
                              <span className="font-medium text-slate-700">
                                {orderCounts[station.id] ?? 0}
                              </span>
                            </p>
                            <button
                              onClick={() => handleToggleActive(station)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#005B97]/20 focus:ring-offset-2 min-h-[44px] min-w-[44px] items-center ${
                                station.isActive ? "bg-[#005B97]" : "bg-slate-200"
                              }`}
                              role="switch"
                              aria-checked={station.isActive}
                              aria-label={`Toggle ${station.label} active`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  station.isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(station.id)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-white bg-[#005B97] active:bg-[#004A7C] transition-colors min-h-[40px]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 active:bg-slate-200 transition-colors min-h-[40px]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : isConfirmingDelete ? (
                              <>
                                <button
                                  onClick={() => handleDelete(station.id)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-white bg-red-600 active:bg-red-700 transition-colors min-h-[40px]"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 active:bg-slate-200 transition-colors min-h-[40px]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(station)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-[#005B97] bg-[#005B97]/5 border border-[#005B97]/10 active:bg-[#005B97]/10 transition-colors min-h-[40px]"
                                  title="Edit station"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(station.id)}
                                  disabled={hasOrders}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors min-h-[40px] ${
                                    hasOrders
                                      ? "text-slate-400 bg-slate-50 border border-slate-100 cursor-not-allowed"
                                      : "text-red-600 bg-red-50 border border-red-100 active:bg-red-100"
                                  }`}
                                  title={
                                    hasOrders
                                      ? `Cannot delete: ${orderCounts[station.id]} order(s) assigned`
                                      : "Delete station"
                                  }
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </SortableStationItem>
                  );
                })}
              </SortableContext>
            </div>

            <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-[140px_1.5fr_2fr_80px_80px_120px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div>ID</div>
                <div>Label</div>
                <div>Description</div>
                <div className="text-center">Order</div>
                <div className="text-center">Active</div>
                <div className="text-right">Actions</div>
              </div>

              <SortableContext
                items={stations.map((station) => `d-${station.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {stations.map((station) => {
                  const isEditing = editingId === station.id;
                  const hasOrders = (orderCounts[station.id] ?? 0) > 0;
                  const isConfirmingDelete = confirmDeleteId === station.id;

                  return (
                    <SortableStationItem
                      key={station.id}
                      id={`d-${station.id}`}
                      disabled={Boolean(editingId) || reordering}
                      className={`grid grid-cols-[140px_1.5fr_2fr_80px_80px_120px] gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 items-center transition-colors ${
                        !station.isActive ? "bg-slate-50/50 opacity-60" : ""
                      }`}
                    >
                      {({ dragHandleProps }) => (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Drag to reorder ${station.label}`}
                              title="Drag to reorder"
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 ${
                                editingId || reordering
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-grab active:cursor-grabbing"
                              }`}
                              {...dragHandleProps}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
                              </svg>
                            </button>
                            <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {station.id}
                            </span>
                          </div>

                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sm font-medium text-slate-900">
                                {station.label}
                              </span>
                            )}
                          </div>

                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                              />
                            ) : (
                              <span className="text-sm text-slate-500">
                                {station.description || "--"}
                              </span>
                            )}
                          </div>

                          <div className="text-center">
                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                              {station.sortOrder}
                            </span>
                          </div>

                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleActive(station)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#005B97]/20 focus:ring-offset-2 min-h-[44px] min-w-[44px] items-center ${
                                station.isActive ? "bg-[#005B97]" : "bg-slate-200"
                              }`}
                              role="switch"
                              aria-checked={station.isActive}
                              aria-label={`Toggle ${station.label} active`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  station.isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(station.id)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-white bg-[#005B97] active:bg-[#004A7C] transition-colors min-h-[44px]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 active:bg-slate-200 transition-colors min-h-[44px]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : isConfirmingDelete ? (
                              <>
                                <button
                                  onClick={() => handleDelete(station.id)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-white bg-red-600 active:bg-red-700 transition-colors min-h-[44px]"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 active:bg-slate-200 transition-colors min-h-[44px]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(station)}
                                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-[#005B97] bg-[#005B97]/5 border border-[#005B97]/10 active:bg-[#005B97]/10 transition-colors min-h-[44px]"
                                  title="Edit station"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(station.id)}
                                  disabled={hasOrders}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors min-h-[44px] ${
                                    hasOrders
                                      ? "text-slate-400 bg-slate-50 border border-slate-100 cursor-not-allowed"
                                      : "text-red-600 bg-red-50 border border-red-100 active:bg-red-100"
                                  }`}
                                  title={
                                    hasOrders
                                      ? `Cannot delete: ${orderCounts[station.id]} order(s) assigned`
                                      : "Delete station"
                                  }
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </SortableStationItem>
                  );
                })}
              </SortableContext>
            </div>
          </DndContext>
        )}

        {/* Empty state */}
        {!loading && stations.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg
              className="h-12 w-12 text-slate-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
            <p className="text-lg font-medium text-slate-500">No stations configured</p>
            <p className="text-sm text-slate-400 mt-1">
              Click &quot;+ Add Station&quot; to create your first station.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
