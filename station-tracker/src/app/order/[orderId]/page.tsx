"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Package,
  Calendar,
  User,
  Building2,
  FileText,
  Tag,
  Clock,
  CheckCircle2,
  PauseCircle,
  AlertTriangle,
  Crosshair,
  DollarSign,
  ChevronRight,
  StickyNote,
} from "lucide-react";
import type { Order, StationId, OrderNoteEntry } from "@/lib/types";
import {
  STATIONS,
  STATION_LABELS,
  parseOrderNotes,
  serializeOrderNotes,
  formatNoteTimestamp,
} from "@/lib/types";
import AppFooter from "@/components/AppFooter";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}


interface StationTimelineItem {
  id: string;
  label: string;
}

export default function OrderDetailPage({ params }: OrderPageProps) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [stationTimeline, setStationTimeline] = useState<StationTimelineItem[]>(
    STATIONS.map((sid) => ({ id: sid, label: STATION_LABELS[sid] }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<OrderNoteEntry[]>([]);
  const [noteSortDirection, setNoteSortDirection] = useState<"asc" | "desc">("desc");
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load order");
          return;
        }
        setOrder(json.data);
        setNotes(parseOrderNotes(json.data));

        // Load configured station order for timeline/index display.
        try {
          const stationRes = await fetch("/api/stations", { cache: "no-store" });
          if (stationRes.ok) {
            const stationJson = await stationRes.json();
            const timeline = Array.isArray(stationJson?.data)
              ? stationJson.data
                  .map(
                    (station: {
                      stationId?: string;
                      label?: string;
                      sortOrder?: number;
                    }) => ({
                      id: station.stationId ?? "",
                      label: station.label ?? station.stationId ?? "",
                      sortOrder:
                        typeof station.sortOrder === "number"
                          ? station.sortOrder
                          : Number.MAX_SAFE_INTEGER,
                    })
                  )
                  .filter((station: { id: string; label: string }) => station.id)
                  .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder)
                  .map((station: { id: string; label: string }) => ({
                    id: station.id,
                    label: station.label,
                  }))
              : [];

            if (timeline.length > 0) {
              setStationTimeline(timeline);
            }
          }
        } catch {
          // Fall back to static station list if timeline fetch fails.
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const sortedNotes = useMemo(() => {
    const rows = [...notes];
    rows.sort((a, b) => {
      const aTs = new Date(a.createdAt).getTime();
      const bTs = new Date(b.createdAt).getTime();
      return noteSortDirection === "asc" ? aTs - bTs : bTs - aTs;
    });
    return rows;
  }, [noteSortDirection, notes]);

  const persistNotes = useCallback(
    async (nextNotes: OrderNoteEntry[]) => {
      setSavingNotes(true);
      setNotesError(null);
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: serializeOrderNotes(nextNotes),
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }
        if (json?.data) {
          setOrder(json.data as Order);
          setNotes(parseOrderNotes(json.data as Order));
        } else {
          setNotes(nextNotes);
        }
      } catch (err) {
        setNotesError(
          err instanceof Error ? err.message : "Failed to save notes"
        );
      } finally {
        setSavingNotes(false);
      }
    },
    [orderId]
  );

  const handleAddNote = async () => {
    const text = newNoteText.trim();
    if (!text || savingNotes) return;
    const timestamp = new Date().toISOString();
    const nextNotes: OrderNoteEntry[] = [
      ...notes,
      {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        createdAt: timestamp,
      },
    ];
    setNewNoteText("");
    await persistNotes(nextNotes);
  };

  const startEditingNote = (note: OrderNoteEntry) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
    setNotesError(null);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
  };

  const saveEditedNote = async () => {
    if (!editingNoteId || savingNotes) return;
    const text = editingNoteText.trim();
    if (!text) return;
    const timestamp = new Date().toISOString();
    const nextNotes = notes.map((note) =>
      note.id === editingNoteId
        ? {
            ...note,
            text,
            updatedAt: timestamp,
          }
        : note
    );
    setEditingNoteId(null);
    setEditingNoteText("");
    await persistNotes(nextNotes);
  };

  if (loading) {
    return (
      <div className="h-dvh bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 animate-shimmer" />
            <div className="text-sm text-slate-400 font-medium">Loading order…</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-dvh bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Order Not Found
            </h2>
            <p className="text-slate-500 mb-6 leading-relaxed">
              {error || "This order does not exist or may have been removed."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-[#005B97] px-6 py-3 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-[#004A7C] active:scale-[0.97] min-h-[48px]"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const stationLabel =
    stationTimeline.find((station) => station.id === order.currentStation)?.label ??
    STATION_LABELS[order.currentStation] ??
    order.currentStation;
  const currentStationIndex = stationTimeline.findIndex(
    (station) => station.id === order.currentStation
  );
  const currentStationNumber =
    currentStationIndex >= 0 ? currentStationIndex + 1 : null;
  const progressPercent =
    stationTimeline.length > 1 && currentStationIndex >= 0
      ? (currentStationIndex / (stationTimeline.length - 1)) * 100
      : 0;

  return (
    <div className="order-detail-page h-dvh bg-slate-50 flex flex-col animate-fade-in">
      <Header orderNumber={order.orderNumber} stationId={order.currentStation} />

      <main className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
        {/* ── HERO BANNER ── */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #005B97 0%, #004A7C 40%, #193D6B 100%)",
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 80% 20%, rgba(100,151,176,0.25) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(0,91,151,0.15) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-10"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />

          <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-4 md:py-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              {/* Left — Order identity */}
              <div>
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  {order.isRush && (
                    <span className="inline-flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm text-white rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide border border-red-400/20">
                      <Flame className="w-3.5 h-3.5" />
                      Rush Order
                    </span>
                  )}
                  <StatusBadge status={order.status} variant="hero" />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-white/50 text-lg font-light">#</span>
                  <h1 className="text-3xl md:text-4xl font-black font-mono tabular-nums text-white tracking-tighter leading-none">
                    {order.orderNumber}
                  </h1>
                </div>

                <p className="text-white/70 text-base font-medium mt-1.5 tracking-wide">
                  {order.customerName}
                </p>
                {order.sidemark && (
                  <p className="text-white/40 text-xs mt-0.5">
                    {order.sidemark}
                  </p>
                )}
              </div>

              {/* Right — Current station badge */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  Current Station
                </span>
                <Link
                  href={`/station/${order.currentStation}`}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] group"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold font-mono"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                    }}
                  >
                    {currentStationNumber ?? "•"}
                  </div>
                  {stationLabel}
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>

            {/* ── STATION PROGRESS PIPELINE ── */}
            <div className="mt-4">
              {/* Progress track line */}
              <div className="relative h-1.5 bg-white/10 rounded-full mb-2.5 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.8) 100%)",
                    boxShadow: "0 0 12px rgba(255,255,255,0.3)",
                  }}
                />
              </div>

              {/* Station pills */}
              <div className="flex items-center justify-between gap-1">
                {stationTimeline.map((station, i) => {
                  const ss = (order.stationStatuses as Record<string, {
                    done: boolean;
                    hold: boolean;
                    missing: boolean;
                  }>)?.[station.id];
                  const isCurrent = station.id === order.currentStation;
                  const isPast = i < currentStationIndex;
                  const isDone = ss?.done;
                  const hasHold = ss?.hold;
                  const hasMissing = ss?.missing;

                  return (
                    <div
                      key={station.id}
                      className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
                    >
                      <div
                        className={`
                          w-full rounded-md px-1 py-1 text-center text-[10px] font-semibold truncate transition-all duration-300
                          ${
                            isCurrent
                              ? "bg-white text-[#005B97] shadow-lg shadow-white/20"
                              : isDone || isPast
                                ? "bg-white/15 text-white/80"
                                : "bg-white/5 text-white/30"
                          }
                        `}
                      >
                        {station.label}
                      </div>
                      <div className="flex gap-0.5 h-4 items-center">
                        {isDone && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        )}
                        {hasHold && (
                          <PauseCircle className="w-3.5 h-3.5 text-rose-300" />
                        )}
                        {hasMissing && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN — Order Details (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Details Card */}
              <SectionCard title="Order Details" icon={<Package className="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <DetailField
                    icon={<Package className="w-4 h-4" />}
                    label="Order Number"
                    value={order.orderNumber}
                    mono
                  />
                  <DetailField
                    icon={<User className="w-4 h-4" />}
                    label="Customer"
                    value={order.customerName}
                  />
                  <DetailField
                    icon={<Building2 className="w-4 h-4" />}
                    label="Department"
                    value={order.department}
                  />
                  <DetailField
                    icon={<Tag className="w-4 h-4" />}
                    label="Status"
                    value={order.status}
                    badge={<StatusBadge status={order.status} />}
                  />
                  <DetailField
                    icon={<Calendar className="w-4 h-4" />}
                    label="Ship Date"
                    value={
                      order.shipDate
                        ? new Date(order.shipDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : null
                    }
                  />
                  <DetailField
                    icon={<Flame className="w-4 h-4" />}
                    label="Rush"
                    value={order.isRush ? "Yes" : "No"}
                    highlight={order.isRush}
                  />
                  <DetailField
                    icon={<FileText className="w-4 h-4" />}
                    label="Sidemark"
                    value={order.sidemark}
                  />
                  <DetailField
                    icon={<Crosshair className="w-4 h-4" />}
                    label="Target"
                    value={order.target}
                  />
                  {order.saleAmount > 0 && (
                    <DetailField
                      icon={<DollarSign className="w-4 h-4" />}
                      label="Sale Amount"
                      value={order.saleAmount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                      mono
                    />
                  )}
                </div>
              </SectionCard>

              {/* Station Status Details */}
              {hasAnyStationDetails(order, stationTimeline.map((station) => station.id)) && (
                <SectionCard title="Station Issues" icon={<AlertTriangle className="w-4 h-4" />}>
                  <div className="space-y-2.5">
                    {stationTimeline.map((station, index) => {
                      const ss = (order.stationStatuses as Record<string, {
                        done: boolean;
                        hold: boolean;
                        holdReason: string;
                        missing: boolean;
                        missingDetails: string;
                      }>)?.[station.id];
                      if (!ss) return null;
                      const hasDetail =
                        ss.hold || ss.missing || ss.holdReason || ss.missingDetails;
                      if (!hasDetail) return null;

                      return (
                        <div
                          key={station.id}
                          className="order-detail-issue-row flex items-start gap-4 rounded-xl px-4 py-3.5 transition-colors"
                          style={{
                            background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                            border: "1px solid rgba(0,91,151,0.06)",
                          }}
                        >
                          <div className="shrink-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white"
                              style={{
                                background:
                                  "linear-gradient(180deg, #0069AD 0%, #005B97 100%)",
                              }}
                            >
                              {index + 1}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-700 mb-1.5">
                              {station.label}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ss.hold && (
                                <span className="order-detail-hold-chip inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 rounded-full px-3 py-1 text-xs font-semibold border border-rose-100">
                                  <PauseCircle className="w-3.5 h-3.5" />
                                  Hold
                                  {ss.holdReason ? `: ${ss.holdReason}` : ""}
                                </span>
                              )}
                              {ss.missing && (
                                <span className="order-detail-missing-chip inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-full px-3 py-1 text-xs font-semibold border border-amber-100">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Missing
                                  {ss.missingDetails
                                    ? `: ${ss.missingDetails}`
                                    : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              )}
            </div>

            {/* RIGHT COLUMN — Sidebar (1/3 width) */}
            <div className="space-y-6">
              {/* Notes Card */}
              <SectionCard
                title="Notes"
                icon={<StickyNote className="w-4 h-4" />}
                compact
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                      {sortedNotes.length} note{sortedNotes.length === 1 ? "" : "s"}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setNoteSortDirection((v) => (v === "asc" ? "desc" : "asc"))
                      }
                      className="text-xs text-[#005B97] hover:text-[#004A7C] underline underline-offset-2"
                    >
                      Sort by day created:{" "}
                      {noteSortDirection === "asc" ? "Oldest first" : "Newest first"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {sortedNotes.length === 0 ? (
                      <p className="text-sm text-slate-300 italic">No notes</p>
                    ) : (
                      sortedNotes.map((note) => {
                        const isEditing = editingNoteId === note.id;
                        return (
                          <div
                            key={note.id}
                            className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {formatNoteTimestamp(note.updatedAt ?? note.createdAt)}
                                {note.updatedAt ? " (edited)" : ""}
                              </span>
                              {!isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => startEditingNote(note)}
                                  className="text-xs text-[#005B97] hover:text-[#004A7C] underline underline-offset-2"
                                >
                                  Edit
                                </button>
                              ) : null}
                            </div>

                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  rows={3}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={saveEditedNote}
                                    disabled={savingNotes || editingNoteText.trim().length === 0}
                                    className="rounded-lg bg-[#005B97] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {savingNotes ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingNote}
                                    disabled={savingNotes}
                                    className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    Cancel
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
                      })
                    )}
                  </div>

                  <div className="pt-1 space-y-2">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Add a note..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">
                        Each add/edit stores a new timestamp.
                      </span>
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={savingNotes || newNoteText.trim().length === 0}
                        className="rounded-lg bg-[#005B97] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savingNotes ? "Saving..." : "Add Note"}
                      </button>
                    </div>
                    {notesError ? (
                      <p className="text-xs text-red-500">{notesError}</p>
                    ) : null}
                  </div>
                </div>
              </SectionCard>

              {/* Quick Facts Card */}
              <SectionCard title="Quick Facts" icon={<FileText className="w-4 h-4" />} compact>
                <div className="space-y-3">
                  <QuickFact
                    label="Ship Date"
                    value={
                      order.shipDate
                        ? new Date(order.shipDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"
                    }
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                  <div className="h-px bg-slate-100" />
                  <QuickFact
                    label="Department"
                    value={order.department || "—"}
                    icon={<Building2 className="w-3.5 h-3.5" />}
                  />
                  {order.saleAmount > 0 && (
                    <>
                      <div className="h-px bg-slate-100" />
                      <QuickFact
                        label="Amount"
                        value={order.saleAmount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                        icon={<DollarSign className="w-3.5 h-3.5" />}
                        mono
                      />
                    </>
                  )}
                  <div className="h-px bg-slate-100" />
                  <QuickFact
                    label="Station"
                    value={`${currentStationNumber ?? "—"} of ${stationTimeline.length} — ${stationLabel}`}
                    icon={<Package className="w-3.5 h-3.5" />}
                  />
                </div>
              </SectionCard>

              {/* Timestamps */}
              <div
                className="order-detail-meta-card rounded-2xl px-5 py-4"
                style={{
                  background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                  border: "1px solid rgba(0,91,151,0.06)",
                }}
              >
                <div className="space-y-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <span className="font-semibold text-slate-500">Created</span>{" "}
                      {formatTimestamp(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <span className="font-semibold text-slate-500">Updated</span>{" "}
                      {formatTimestamp(order.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header({
  orderNumber,
  stationId,
}: {
  orderNumber?: string;
  stationId?: StationId;
}) {
  return (
    <header
      className="order-detail-header relative shrink-0 px-6 md:px-8 py-4 flex items-center justify-between"
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

      <div className="relative flex items-center gap-4">
        <Link
          href="/"
          className="order-detail-header-back flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
          style={{
            background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,91,151,0.08)",
            color: "#475569",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {orderNumber && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <h1
              className="text-lg font-bold tracking-tight text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              Order{" "}
              <span className="font-mono tabular-nums">{orderNumber}</span>
            </h1>
          </>
        )}
      </div>

      <div className="relative flex items-center gap-3">
        {stationId && (
          <Link
            href={`/station/${stationId}`}
            className="text-xs font-medium text-[#6497B0] hover:text-[#005B97] transition-colors hidden sm:flex items-center gap-1"
          >
            View Station <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        <ThemeToggle />
        <OrderSearch theme="light" />
        <SmartLogoLink
          alt="Skyco Shading Systems"
          imgClassName="relative h-8 w-auto"
        />
      </div>
    </header>
  );
}

function SectionCard({
  title,
  icon,
  compact,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="order-detail-card rounded-2xl bg-white"
      style={{
        border: "1px solid rgba(0,91,151,0.08)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,91,151,0.04)",
      }}
    >
      {/* Section header */}
      <div
        className="order-detail-card-header flex items-center gap-2.5 px-6 py-3.5"
        style={{
          borderBottom: "1px solid rgba(0,91,151,0.06)",
          background: "linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%)",
          borderRadius: "16px 16px 0 0",
        }}
      >
        <div className="text-[#6497B0]">{icon}</div>
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          {title}
        </h2>
      </div>
      <div className={compact ? "px-5 py-4" : "px-6 py-5"}>{children}</div>
    </div>
  );
}

function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "hero";
}) {
  let bg = "bg-slate-100 text-slate-600 border-slate-200";
  if (status === "Complete" || status === "Full Packed") {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (
    status === "Missing Parts" ||
    status === "Complete But M/P" ||
    status === "Sch + M/P"
  ) {
    bg = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (status === "Credit Hold" || status === "Print Hold") {
    bg = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (status === "Producible" || status === "Approved for Production") {
    bg = "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (variant === "hero") {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${bg}`}
    >
      {status}
    </span>
  );
}

function DetailField({
  icon,
  label,
  value,
  mono,
  highlight,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  highlight?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-0.5 text-slate-300 group-hover:text-[#6497B0] transition-colors shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">
          {label}
        </div>
        {badge ? (
          badge
        ) : (
          <div
            className={`text-sm leading-relaxed ${
              highlight
                ? "text-red-600 font-semibold"
                : value
                  ? "text-slate-800 font-medium"
                  : "text-slate-300 italic"
            } ${mono ? "font-mono tabular-nums" : ""}`}
          >
            {value || "—"}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickFact({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span
        className={`text-sm font-semibold text-slate-700 ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function hasAnyStationDetails(order: Order, stationIds: string[]): boolean {
  return stationIds.some((stationId) => {
    const ss = (order.stationStatuses as Record<string, {
      hold: boolean;
      missing: boolean;
      holdReason: string;
      missingDetails: string;
    }>)?.[stationId];
    return ss && (ss.hold || ss.missing || ss.holdReason || ss.missingDetails);
  });
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}


