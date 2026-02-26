"use client";

import { useCallback, useRef } from "react";
import { Check, Pause, AlertTriangle } from "lucide-react";
import type { StatusField } from "@/lib/types";

interface StatusCellProps {
  field: StatusField;
  active: boolean;
  onToggle: () => void;
  orderNumber: string;
  rowIndex: number;
  disabled?: boolean;
}

const STATUS_CONFIG = {
  done: {
    activeStyle: {
      background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(5,150,105,0.3), 0 0 16px rgba(5,150,105,0.15)",
    },
    activeText: "text-white",
    inactiveDot: "bg-slate-200",
    label: "Done",
    Icon: Check,
  },
  hold: {
    activeStyle: {
      background: "linear-gradient(180deg, #FB7185 0%, #E11D48 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(225,29,72,0.3), 0 0 16px rgba(225,29,72,0.15)",
    },
    activeText: "text-white",
    inactiveDot: "bg-slate-200",
    label: "Hold",
    Icon: Pause,
  },
  missing: {
    activeStyle: {
      background: "linear-gradient(180deg, #FBBF24 0%, #D97706 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(217,119,6,0.3), 0 0 16px rgba(217,119,6,0.15)",
    },
    activeText: "text-white",
    inactiveDot: "bg-slate-200",
    label: "Missing",
    Icon: AlertTriangle,
  },
} as const;

const DEBOUNCE_MS = 400;

export default function StatusCell({
  field,
  active,
  onToggle,
  orderNumber,
  rowIndex,
  disabled = false,
}: StatusCellProps) {
  const config = STATUS_CONFIG[field];
  const Icon = config.Icon;
  const lastTapRef = useRef<number>(0);
  const inactiveBase = rowIndex % 2 === 0 ? "station-row-even-bg" : "station-row-odd-bg";
  const inactiveHover =
    field === "done"
      ? "hover:bg-emerald-50 active:bg-emerald-100"
      : field === "hold"
        ? "hover:bg-rose-50 active:bg-rose-100"
        : "hover:bg-amber-50 active:bg-amber-100";

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastTapRef.current < DEBOUNCE_MS) return;
    lastTapRef.current = now;
    onToggle();
  }, [disabled, onToggle]);

  return (
    <button
      type="button"
      className={`
        status-cell-button status-cell-${field}
        min-h-[72px] w-full
        flex items-center justify-center
        border-b border-slate-100
        cursor-pointer select-none
        transition-all duration-150 ease-out
        active:scale-[0.93]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97] focus-visible:ring-inset
        ${
          active
            ? `${config.activeText} hover:brightness-110`
            : `${inactiveBase} ${inactiveHover}`
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
      style={active ? config.activeStyle : undefined}
      onClick={handleToggle}
      role="switch"
      aria-checked={active}
      aria-label={`${config.label} status for order ${orderNumber}: currently ${active ? "on" : "off"}`}
      disabled={disabled}
    >
      {active ? (
        <Icon className="w-8 h-8" strokeWidth={2.5} />
      ) : (
        <div className={`status-inactive-dot w-3 h-3 rounded-full ${config.inactiveDot}`} />
      )}
    </button>
  );
}
