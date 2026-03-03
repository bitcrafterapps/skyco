"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Inbox } from "lucide-react";
import type { StationOrder, StatusField } from "@/lib/types";
import OrderRow from "./OrderRow";
import {
  DndContext,
  closestCenter,
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

interface OrderTableProps {
  orders: StationOrder[];
  onToggleStatus: (orderId: string, field: StatusField) => void;
  onReorder?: (orderIds: string[]) => void;
  loading: boolean;
  stationLabel?: string;
  /** Configured advance delay in ms — passed to each row for the countdown */
  advanceDelayMs?: number;
}

function ColumnHeaders() {
  return (
    <div
      className="sticky top-0 z-20 grid grid-cols-[2fr_1fr_1fr_1fr] w-full"
      role="row"
    >
      <div
        className="station-column-header backdrop-blur-sm px-5 md:px-6 py-3.5 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
        role="columnheader"
      >
        Order
      </div>
      <div
        className="station-column-header backdrop-blur-sm px-3 py-3.5 border-b border-slate-200 text-center text-[11px] font-semibold uppercase tracking-widest text-emerald-600/70"
        role="columnheader"
      >
        Done
      </div>
      <div
        className="station-column-header backdrop-blur-sm px-3 py-3.5 border-b border-slate-200 text-center text-[11px] font-semibold uppercase tracking-widest text-rose-600/70"
        role="columnheader"
      >
        Hold
      </div>
      <div
        className="station-column-header backdrop-blur-sm px-3 py-3.5 border-b border-slate-200 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-600/70"
        role="columnheader"
      >
        Missing
      </div>
    </div>
  );
}

function OrderRowSkeleton({ index }: { index: number }) {
  return (
    <div
      className="grid grid-cols-[2fr_1fr_1fr_1fr] w-full"
      role="row"
      aria-hidden="true"
    >
      {/* Order info skeleton */}
      <div
        className={`
          px-5 md:px-6 py-3.5 md:py-4
          border-b border-slate-100
          ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
        `}
      >
        <div className="h-6 w-24 bg-slate-100 rounded-md animate-shimmer mb-2" />
        <div className="h-4 w-44 bg-slate-100 rounded-md animate-shimmer" />
      </div>

      {/* Status cell skeletons */}
      {[0, 1, 2].map((j) => (
        <div
          key={j}
          className={`
            min-h-[72px]
            border-b border-slate-100
            ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
            flex items-center justify-center
          `}
        >
          <div className="w-10 h-10 bg-slate-100 rounded-xl animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

export default function OrderTable({
  orders,
  onToggleStatus,
  onReorder,
  loading,
  stationLabel,
  advanceDelayMs = 5 * 60_000,
}: OrderTableProps) {
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const prevOrdersRef = useRef<string[]>([]);

  // Track new orders for animation
  useEffect(() => {
    const currentIds = orders.map((o) => o.id);
    const prevIds = prevOrdersRef.current;

    if (prevIds.length > 0) {
      const newIds = currentIds.filter((id) => !prevIds.includes(id));
      if (newIds.length > 0) {
        setKnownIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.add(id));
          // Clear the "new" marker after animation
          setTimeout(() => {
            setKnownIds((p) => {
              const cleaned = new Set(p);
              newIds.forEach((id) => cleaned.delete(id));
              return cleaned;
            });
          }, 500);
          return next;
        });
      }
    }

    prevOrdersRef.current = currentIds;
  }, [orders]);

  // Sensors for drag-and-drop: touch with distance activation, pointer for mouse
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const sensors = useSensors(touchSensor, pointerSensor);

  const orderIds = useMemo(() => orders.map((o) => o.id), [orders]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = orderIds.indexOf(String(active.id));
      const newIndex = orderIds.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrderIds = arrayMove(orderIds, oldIndex, newIndex);
      onReorder?.(newOrderIds);
    },
    [orderIds, onReorder]
  );

  // Skeleton loading state
  if (loading && orders.length === 0) {
    return (
      <div className="overflow-y-auto overscroll-contain custom-scrollbar h-full relative">
        <div
          className="w-full"
          role="grid"
          aria-label="Loading orders"
        >
          <ColumnHeaders />

          {/* Skeleton Rows */}
          {Array.from({ length: 8 }, (_, i) => (
            <OrderRowSkeleton key={`skeleton-${i}`} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-5 px-8">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Inbox className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            No Orders
          </h2>
          <p className="text-base text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            All clear{stationLabel ? ` at ${stationLabel}` : ""}. Orders will
            appear here when assigned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto overscroll-contain custom-scrollbar h-full relative">
      <div
        className="w-full"
        role="grid"
        aria-label="Orders for this station"
      >
        {/* Sticky Column Headers */}
        <ColumnHeaders />

        {/* Order Rows with drag-and-drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderIds}
            strategy={verticalListSortingStrategy}
          >
            {orders.map((order, i) => (
              <OrderRow
                key={order.id}
                order={order}
                index={i}
                onToggleStatus={onToggleStatus}
                isNew={knownIds.has(order.id)}
                advanceDelayMs={advanceDelayMs}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Bottom scroll fade -- taller for tablet touch scrolling */}
      <div className="station-table-bottom-fade sticky bottom-0 h-20 pointer-events-none bg-linear-to-t from-slate-50 to-transparent" />
    </div>
  );
}
