"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_NAV_ITEMS = [
  { href: "/admin", label: "Admin", exact: true },
  { href: "/admin/stations", label: "Stations" },
  { href: "/admin/sheets", label: "Sheets" },
  { href: "/admin/preferences", label: "Preferences" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/tools", label: "Tools" },
];

export default function AdminSubNav() {
  const pathname = usePathname();

  return (
    <div className="admin-subnav-shell px-0 py-2 bg-slate-50/90 backdrop-blur-sm">
      <div className="admin-subnav-track w-full p-1.5 bg-slate-100/80 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar">
          {SUB_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`admin-subnav-item rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-out active:scale-[0.97] min-h-[34px] sm:min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50 flex items-center shrink-0 border ${
                  isActive
                    ? "admin-subnav-item-active text-white border-[#004A7C]/80"
                    : "text-slate-700 bg-white/70 border-slate-200 hover:text-slate-900 hover:bg-slate-100 hover:border-[#005B97]/50 hover:shadow-[0_2px_8px_rgba(0,91,151,0.18)] hover:-translate-y-px"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
