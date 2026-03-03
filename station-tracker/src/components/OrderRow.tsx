"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { StationOrder, StatusField } from "@/lib/types";
import { STATION_LABELS } from "@/lib/types";
import StatusCell from "./StatusCell";
import RushBadge from "./RushBadge";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OrderRowProps {
  order: StationOrder;
  index: number;
  onToggleStatus: (orderId: string, field: StatusField) => void;
  isNew?: boolean;
  /** Configured advance delay in ms — drives countdown timer and fade-out timing */
  advanceDelayMs?: number;
}

/** Format remaining ms as M:SS */
function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function OrderRow({
  order,
  index,
  onToggleStatus,
  isNew = false,
  advanceDelayMs = 5 * 60_000,
}: OrderRowProps) {
  const [fadingOut, setFadingOut] = useState(false);
  // null = not counting, number = remaining ms
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const [showNewPill, setShowNewPill] = useState(false);

  // Determine if the "NEW" pill should be shown based on autoAdvancedAt
  useEffect(() => {
    if (!order.autoAdvancedAt) {
      setShowNewPill(false);
      return;
    }
    const targetHideTime = order.autoAdvancedAt + advanceDelayMs;
    const updatePill = () => {
      const remaining = targetHideTime - Date.now();
      if (remaining > 0) {
        setShowNewPill(true);
      } else {
        setShowNewPill(false);
      }
    };
    
    updatePill();
    const interval = setInterval(updatePill, 1000);
    return () => clearInterval(interval);
  }, [order.autoAdvancedAt, advanceDelayMs]);

  // Countdown timer + fade-out — driven by advanceDelayMs
  useEffect(() => {
    if (!order.done || !order.doneAt) {
      setFadingOut(false);
      setCountdown(null);
      return;
    }

    const targetTime = order.doneAt + advanceDelayMs;

    const update = () => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        setCountdown(0);
        setFadingOut(true);
      } else {
        setCountdown(remaining);
        // Begin fade animation 1 second before advance so row collapses smoothly
        setFadingOut(remaining <= 1000);
      }
    };

    update(); // Immediate first tick
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order.done, order.doneAt, advanceDelayMs]);

  // True while done but before fade starts — row is "pending advance"
  const isPendingAdvance = order.done && !fadingOut;

  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  const bgClass = index % 2 === 0 ? "station-row-even-bg" : "station-row-odd-bg";

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`
        order-row-hover-highlight
        grid grid-cols-[2fr_1fr_1fr_1fr] w-full
        ${isNew ? "animate-slide-in" : ""}
        ${isDragging ? "opacity-50 shadow-lg rounded-lg" : ""}
      `}
      {...attributes}
      role="row"
      aria-label={`Order ${order.orderNumber}`}
    >
      {/* ORDER INFO CELL */}
      <div
        className={`
          order-row-info-cell
          px-5 py-3.5 md:px-6 md:py-4
          flex items-center gap-2
          border-b border-slate-100
          ${bgClass}
          ${order.isRush ? "border-l-[3px] border-l-red-500" : ""}
          ${isPendingAdvance ? "opacity-60 transition-opacity duration-1000 ease-out" : ""}
          ${fadingOut ? "animate-fade-out-collapse" : ""}
        `}
        role="gridcell"
      >
        {/* Drag handle */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          type="button"
          className="touch-none shrink-0 flex items-center justify-center w-7 h-10 -ml-2 rounded-md text-slate-300 hover:text-slate-500 active:text-slate-600 transition-colors cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]"
          aria-label={`Drag to reorder order ${order.orderNumber}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex flex-col justify-center gap-0.5 min-w-0">
          {/* ── NEW pill ──────────────────────────────────── */}
          {showNewPill && (
            <div className="flex items-center mb-0.5">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200/70">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                NEW
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {order.isRush && <RushBadge />}
            <Link
              href={`/order/${order.id}`}
              className="text-2xl font-semibold font-mono tracking-tight text-slate-900 tabular-nums leading-tight hover:text-[#005B97] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {order.orderNumber}
            </Link>
          </div>
          <span className="text-sm text-slate-600 font-medium truncate max-w-[280px] md:max-w-[400px]">
            {order.customerName}
          </span>
          {order.sidemark && (
            <span className="text-xs text-slate-400 truncate max-w-[280px] md:max-w-[400px]">
              {order.sidemark}
            </span>
          )}

          {/* ── Countdown timer ─────────────────────────────────────── */}
          {order.done && countdown !== null && (
            <div className="flex items-center gap-1.5 mt-1">
              {countdown > 0 ? (
                <>
                  {/* Pulsing green dot */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
                    Moving in {formatCountdown(countdown)}
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                  </span>
                  <span className="text-xs font-mono font-semibold text-sky-700">
                    Moving…
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STATUS CELLS */}
      <StatusCell
        field="done"
        active={order.done}
        rowIndex={index}
        onToggle={() => onToggleStatus(order.id, "done")}
        orderNumber={order.orderNumber}
      />
      <StatusCell
        field="hold"
        active={order.hold}
        rowIndex={index}
        onToggle={() => onToggleStatus(order.id, "hold")}
        orderNumber={order.orderNumber}
      />
      <StatusCell
        field="missing"
        active={order.missing}
        rowIndex={index}
        onToggle={() => onToggleStatus(order.id, "missing")}
        orderNumber={order.orderNumber}
      />
    </div>
  );
}
