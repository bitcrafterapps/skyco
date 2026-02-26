"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Flame, Pause, AlertTriangle, GripVertical, Package } from "lucide-react";
import { useKanbanOrders, type KanbanColumn } from "@/hooks/useKanbanOrders";
import type { StationOrder } from "@/lib/types";

// ---------------------------------------------------------------------------
// Kanban Order Card (compact card for inside columns)
// ---------------------------------------------------------------------------
interface KanbanCardProps {
  order: StationOrder;
  isDragging?: boolean;
  isOverlay?: boolean;
}

function KanbanCardContent({ order, isDragging, isOverlay }: KanbanCardProps) {
  const hasIssue = order.hold || order.missing;

  return (
    <div
      className={`
        group/card kanban-order-card relative rounded-xl p-3.5 bg-white
        transition-all duration-150 ease-out
        ${isDragging ? "opacity-40 scale-[0.97]" : ""}
        ${isOverlay ? "shadow-2xl scale-[1.03] ring-2 ring-[#005B97]/30 z-50" : ""}
        ${hasIssue ? "ring-1 ring-amber-200" : ""}
        ${order.done ? "opacity-60" : ""}
      `}
      style={{
        border: isOverlay
          ? "1px solid rgba(0,91,151,0.2)"
          : "1px solid rgba(0,91,151,0.08)",
        boxShadow: isOverlay
          ? "0 20px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,91,151,0.1)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      {/* Top row: order number + grip */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {order.isRush && (
            <div className="kanban-rush-chip shrink-0 flex items-center gap-1 bg-red-50 rounded-full px-1.5 py-0.5">
              <Flame className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Rush</span>
            </div>
          )}
          <Link
            href={`/order/${order.id}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="font-mono text-sm font-bold text-[#005B97] tabular-nums truncate hover:text-[#004A7C] hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50 rounded"
          >
            #{order.orderNumber}
          </Link>
        </div>
        <div className="shrink-0 text-slate-300 group-hover/card:text-slate-400 transition-colors cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Customer name */}
      <p className="kanban-card-customer text-sm text-slate-700 font-medium truncate mb-1.5">
        {order.customerName}
      </p>

      {/* Sidemark — if present */}
      {order.sidemark && (
        <p className="kanban-card-sidemark text-xs text-slate-400 truncate mb-2">
          {order.sidemark}
        </p>
      )}

      {/* Bottom row: status badges + ship date */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1.5">
          {order.hold && (
            <div className="kanban-hold-chip flex items-center gap-1 bg-rose-50 rounded-full px-1.5 py-0.5">
              <Pause className="w-3 h-3 text-rose-500" />
              <span className="text-[10px] font-semibold text-rose-600">Hold</span>
            </div>
          )}
          {order.missing && (
            <div className="kanban-missing-chip flex items-center gap-1 bg-amber-50 rounded-full px-1.5 py-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-semibold text-amber-600">Missing</span>
            </div>
          )}
        </div>
        {order.shipDate && (
          <span className="kanban-card-date text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
            {new Date(order.shipDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Card Wrapper
// ---------------------------------------------------------------------------
interface DraggableCardProps {
  order: StationOrder;
  stationId: string;
}

function DraggableCard({ order, stationId }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: {
      order,
      fromStation: stationId,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="animate-fade-in"
    >
      <KanbanCardContent order={order} isDragging={isDragging} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable Column
// ---------------------------------------------------------------------------
interface KanbanColumnViewProps {
  column: KanbanColumn;
  isOver: boolean;
  index: number;
}

function KanbanColumnView({ column, isOver, index }: KanbanColumnViewProps) {
  const { setNodeRef } = useDroppable({
    id: `station-${column.stationId}`,
    data: {
      stationId: column.stationId,
    },
  });

  const issueCount = column.orders.filter((o) => o.hold || o.missing).length;
  const rushCount = column.orders.filter((o) => o.isRush).length;

  return (
    <div
      ref={setNodeRef}
      className={`
        kanban-column-surface
        flex flex-col rounded-2xl min-w-[280px] max-w-[320px] w-[300px] shrink-0
        transition-all duration-200 ease-out
        ${isOver ? "ring-2 ring-[#005B97]/40 scale-[1.01]" : ""}
      `}
      style={{
        background: isOver
          ? "linear-gradient(180deg, rgba(0,91,151,0.04) 0%, rgba(0,91,151,0.02) 100%)"
          : "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
        border: isOver
          ? "1px solid rgba(0,91,151,0.15)"
          : "1px solid rgba(0,91,151,0.08)",
        boxShadow: isOver
          ? "0 4px 20px rgba(0,91,151,0.1), inset 0 1px 0 rgba(255,255,255,0.8)"
          : "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Column Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-xs font-bold font-mono tabular-nums shrink-0"
              style={{
                background:
                  "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.15), 0 1px 3px rgba(0,91,151,0.2)",
              }}
            >
              {index + 1}
            </div>
            <h3 className="kanban-column-title text-sm font-bold tracking-tight text-slate-800">
              {column.label}
            </h3>
          </div>
          {/* Order count badge */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-xs font-bold tabular-nums"
            style={{
              background: column.orders.length > 0
                ? "linear-gradient(180deg, #005B97 0%, #004A7C 100%)"
                : "#E2E8F0",
              color: column.orders.length > 0 ? "#FFFFFF" : "#94A3B8",
              boxShadow: column.orders.length > 0
                ? "0 1px 3px rgba(0,91,151,0.3)"
                : "none",
            }}
          >
            {column.orders.length}
          </div>
        </div>

        {/* Mini indicators row */}
        {(rushCount > 0 || issueCount > 0) && (
          <div className="flex items-center gap-2 mt-2">
            {rushCount > 0 && (
              <div className="kanban-rush-chip flex items-center gap-1 bg-red-50 rounded-full px-1.5 py-0.5">
                <Flame className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-bold text-red-600 tabular-nums">{rushCount}</span>
              </div>
            )}
            {issueCount > 0 && (
              <div className="kanban-missing-chip flex items-center gap-1 bg-amber-50 rounded-full px-1.5 py-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600 tabular-nums">{issueCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column Body — scrollable card list */}
      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar px-3 pb-3 space-y-2.5 min-h-[120px]">
        {column.orders.length === 0 && (
          <div
            className={`
              kanban-empty-state
              flex flex-col items-center justify-center py-8 rounded-xl
              transition-all duration-200
              ${isOver ? "bg-[#005B97]/5" : ""}
            `}
          >
            <Package className={`w-8 h-8 mb-2 ${isOver ? "text-[#005B97]/40" : "text-slate-200"} transition-colors`} />
            <p className={`text-xs font-medium ${isOver ? "text-[#005B97]/50" : "text-slate-300"} transition-colors`}>
              {isOver ? "Drop here" : "No orders"}
            </p>
          </div>
        )}

        {column.orders.map((order) => (
          <DraggableCard
            key={order.id}
            order={order}
            stationId={column.stationId}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Kanban Board
// ---------------------------------------------------------------------------
export default function KanbanBoard() {
  const { columns, loading, error, moveOrder } = useKanbanOrders();
  const [activeOrder, setActiveOrder] = useState<StationOrder | null>(null);
  const [overStationId, setOverStationId] = useState<string | null>(null);

  // Sensors — pointer with 8px activation distance, plus touch
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { order } = event.active.data.current as { order: StationOrder };
    setActiveOrder(order);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id;
    if (overId && typeof overId === "string" && overId.startsWith("station-")) {
      setOverStationId(overId.replace("station-", ""));
    } else {
      setOverStationId(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveOrder(null);
      setOverStationId(null);

      const { active, over } = event;
      if (!over) return;

      const { order, fromStation } = active.data.current as {
        order: StationOrder;
        fromStation: string;
      };

      // Extract destination station ID
      const overId = String(over.id);
      const toStation = overId.startsWith("station-")
        ? overId.replace("station-", "")
        : null;

      if (!toStation || toStation === fromStation) return;

      moveOrder(order.id, fromStation, toStation);
    },
    [moveOrder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveOrder(null);
    setOverStationId(null);
  }, []);

  // Memoize total order count
  const totalOrders = useMemo(
    () => columns.reduce((sum, col) => sum + col.orders.length, 0),
    [columns]
  );

  if (error) {
    return (
      <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 max-w-[1800px] mx-auto">
        <p className="font-medium">Failed to load kanban data</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (loading && columns.length === 0) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-4 px-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl min-w-[280px] w-[300px] shrink-0 p-4"
            style={{
              background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
              border: "1px solid rgba(0,91,151,0.08)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-slate-200 rounded-lg animate-shimmer" />
              <div className="h-4 w-24 bg-slate-200 rounded-md animate-shimmer" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="bg-white rounded-xl p-3.5 mb-2.5 border border-slate-100"
              >
                <div className="h-4 w-20 bg-slate-100 rounded-md animate-shimmer mb-2" />
                <div className="h-3 w-32 bg-slate-100 rounded-md animate-shimmer mb-2" />
                <div className="h-3 w-16 bg-slate-100 rounded-md animate-shimmer" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <span className="kanban-summary-text text-xs text-slate-400 font-medium uppercase tracking-widest">
          {totalOrders} order{totalOrders !== 1 ? "s" : ""} across {columns.length} stations
        </span>
        <div className="kanban-summary-divider flex-1 h-px bg-slate-200" />
        <span className="kanban-summary-text text-[11px] text-slate-400 font-medium">
          Drag orders between stations
        </span>
      </div>

      {/* Kanban columns — horizontal scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain custom-scrollbar pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 min-h-full px-1" style={{ height: "calc(100% - 8px)" }}>
            {columns.map((column, index) => (
              <KanbanColumnView
                key={column.stationId}
                column={column}
                isOver={overStationId === column.stationId}
                index={index}
              />
            ))}
          </div>

          {/* Drag Overlay — floating card that follows cursor */}
          <DragOverlay dropAnimation={null}>
            {activeOrder ? (
              <div className="w-[280px]">
                <KanbanCardContent order={activeOrder} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
