"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { StationOrder, StatusField } from "@/lib/types";
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
}

// Auto-dismiss delay for completed orders (30 seconds)
const DONE_DISMISS_DELAY = 30_000;

export default function OrderRow({
  order,
  index,
  onToggleStatus,
  isNew = false,
}: OrderRowProps) {
  const [fadingOut, setFadingOut] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  // When order is marked done, start a timer for fade-out
  useEffect(() => {
    if (!order.done || !order.doneAt) {
      setFadingOut(false);
      return;
    }

    const elapsed = Date.now() - order.doneAt;
    const remaining = DONE_DISMISS_DELAY - elapsed;

    if (remaining <= 0) {
      setFadingOut(true);
      return;
    }

    const timer = setTimeout(() => {
      setFadingOut(true);
    }, remaining);

    return () => clearTimeout(timer);
  }, [order.done, order.doneAt]);

  const isCompletedFading = order.done && !fadingOut;

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
          ${isCompletedFading ? "opacity-30 transition-opacity duration-2000 ease-out" : ""}
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
