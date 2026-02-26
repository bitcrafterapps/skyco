"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { STATION_LABELS } from "@/lib/types";
import type { StationId } from "@/lib/types";

interface SearchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  currentStation: string;
  isRush: boolean;
}

interface OrderSearchProps {
  theme?: "light" | "dark";
}

export default function OrderSearch({ theme = "light" }: OrderSearchProps) {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<SearchOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadRecentOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders?limit=10&sort=recent", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load recent orders");
      }
      const payload = await response.json();
      const data = Array.isArray(payload?.data) ? payload.data : [];
      setOrders(data.slice(0, 10));
      setLoadFailed(false);
    } catch {
      setOrders([]);
      setLoadFailed(true);
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  // Fetch top 10 most recent orders on mount
  useEffect(() => {
    void loadRecentOrders();
  }, []);

  // Filter the loaded 10 locally as user types
  const filtered = query.trim()
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
          o.customerName.toLowerCase().includes(query.toLowerCase())
      )
    : orders;

  const handleSelect = (order: SearchOrder) => {
    router.push(`/order/${order.id}`);
    setOpen(false);
    setQuery("");
  };

  const ensureOpenAndLoad = () => {
    setOpen(true);
    if (!hasLoaded || (orders.length === 0 && loadFailed && !loading)) {
      void loadRecentOrders();
    }
  };

  const updateMenuPosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const preferredWidth = window.innerWidth >= 640 ? 320 : 288;
    const width = Math.min(preferredWidth, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    const top = rect.bottom + 6;
    setMenuStyle({ top, left, width });
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInput = containerRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedInput && !clickedMenu) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div
        className="flex items-center gap-1.5 px-2.5 sm:px-3 md:px-3.5 rounded-lg sm:rounded-xl min-h-[32px] sm:min-h-[40px] md:min-h-[44px]"
        style={{
          background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
          border: "1px solid rgba(0,91,151,0.12)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <Search
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-[#6497B0]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={ensureOpenAndLoad}
          onClick={ensureOpenAndLoad}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          placeholder="Search orders…"
          className="order-search-input h-full bg-transparent outline-none text-xs sm:text-sm w-28 sm:w-36 md:w-44 font-medium text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* Dropdown */}
      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-white rounded-xl overflow-hidden z-9999"
          style={{
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
            border: "1px solid rgba(0,91,151,0.1)",
            boxShadow: "0 8px 32px rgba(0,91,151,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
              Recent Orders
            </p>
          </div>

          {loading ? (
            <div className="px-4 py-3 text-xs text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400">No orders found</div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
              {filtered.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleSelect(order)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors duration-100 focus-visible:outline-none focus-visible:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        #{order.orderNumber}
                      </div>
                      {order.isRush && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-600">
                          Rush
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                      {order.customerName}
                    </div>
                  </div>
                  <div
                    className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      color: "#005B97",
                      background: "rgba(0,91,151,0.06)",
                    }}
                  >
                    {STATION_LABELS[order.currentStation as StationId] ?? order.currentStation}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
