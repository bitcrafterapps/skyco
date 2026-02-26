"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "theme_preference";

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initialTheme: ThemeMode = "light";
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "dark") {
        initialTheme = "dark";
      }
    } catch {
      initialTheme = "light";
    }
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures
    }
  };

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="shrink-0 whitespace-nowrap rounded-lg sm:rounded-xl px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium min-h-[32px] sm:min-h-[40px] md:min-h-[44px] transition-colors cursor-pointer"
      style={
        isDark
          ? {
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
            }
          : {
              background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
              border: "1px solid rgba(0,91,151,0.12)",
              color: "#005B97",
            }
      }
    >
      <span className="inline-flex items-center gap-1.5">
        {isDark ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .28 0 .56.02.84A7 7 0 0 0 20.16 12c.28 0 .56 0 .84-.02z" />
          </svg>
        )}
        <span className="hidden xs:inline">{isDark ? "Light" : "Dark"}</span>
      </span>
    </button>
  );
}
