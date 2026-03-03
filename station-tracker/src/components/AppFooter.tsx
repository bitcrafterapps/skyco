 "use client";

import { usePathname } from "next/navigation";

export default function AppFooter() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <footer
      className="relative shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t"
      style={{
        background: isHome
          ? "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)"
          : "linear-gradient(180deg, #111827 0%, #0F172A 100%)",
        borderTop: isHome
          ? "1px solid rgba(0,91,151,0.08)"
          : "1px solid rgba(148, 163, 184, 0.25)",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col xs:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <img
            src="/skyco-logo.svg"
            alt="Skyco"
            className={`h-5 sm:h-6 w-auto ${isHome ? "opacity-70" : "opacity-85 brightness-0 invert"}`}
          />
          <span className={isHome ? "text-slate-500" : "text-slate-300"}>
            © {new Date().getFullYear()} Skyco Shading Systems
          </span>
        </div>
        <div className="text-slate-400 font-mono tabular-nums">
          v1.00.07
        </div>
      </div>
    </footer>
  );
}
