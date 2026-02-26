"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { STATIONS, STATION_LABELS, type StationId } from "@/lib/types";
import AdminSubNav from "@/components/AdminSubNav";
import AppFooter from "@/components/AppFooter";
import OrderSearch from "@/components/OrderSearch";
import SmartLogoLink from "@/components/SmartLogoLink";
import ThemeToggle from "@/components/ThemeToggle";

interface DefaultViewPreference {
  mode: "grid" | "station";
  stationId?: StationId;
}

export default function PreferencesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "station">("grid");
  const [selectedStation, setSelectedStation] = useState<StationId>("basket");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Load preferences from localStorage
    try {
      const preferenceRaw = localStorage.getItem("default_view_preference");
      if (preferenceRaw) {
        const preference: DefaultViewPreference = JSON.parse(preferenceRaw);
        setViewMode(preference.mode);
        if (preference.stationId) {
          setSelectedStation(preference.stationId);
        }
      }
    } catch (e) {
      console.error("Failed to parse preference:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setMessage(null);

    try {
      const preference: DefaultViewPreference = {
        mode: viewMode,
        ...(viewMode === "station" && { stationId: selectedStation }),
      };

      // Save to localStorage
      localStorage.setItem("default_view_preference", JSON.stringify(preference));

      setMessage({ type: "success", text: "Preferences saved successfully to this browser." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save preferences",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin text-[#005B97]" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading preferences...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Premium header with bevel and radiance */}
      <header
        className="relative px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:py-5"
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
        <div className="relative flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full md:w-auto min-w-0 md:min-w-[290px]">
            <Link
              href="/admin"
              className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97] shrink-0"
              style={{
                background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,91,151,0.08)",
              }}
              aria-label="Back to admin"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <SmartLogoLink
              alt="Skyco"
              imgClassName="h-7 sm:h-8 md:h-10 w-auto"
            />
            <div className="h-6 sm:h-7 md:h-8 w-px bg-slate-200" />
            <div className="min-w-0 flex-1">
              <h1
                className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap"
                style={{ letterSpacing: "-0.02em" }}
              >
                Preferences
              </h1>
              <p className="text-xs text-[#6497B0] font-medium hidden lg:block">
                Configure default dashboard view for this browser
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full md:flex-1 md:min-w-0 justify-start md:justify-end overflow-x-auto overflow-y-visible hide-scrollbar pb-0.5 md:pb-0">
            <ThemeToggle />
            <OrderSearch theme="light" />
          </div>
        </div>
      </header>
      <AdminSubNav />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Default View Section */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Default Dashboard View</h2>
            <p className="text-sm text-slate-500 mt-1">
              Choose what the main dashboard (/) displays when first loaded. This preference is
              saved locally in this browser only.
            </p>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Radio options */}
            <div className="space-y-3">
              {/* Grid View Option */}
              <label
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  viewMode === "grid"
                    ? "border-[#005B97] bg-[#005B97]/5"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="viewMode"
                  value="grid"
                  checked={viewMode === "grid"}
                  onChange={(e) => setViewMode(e.target.value as "grid" | "station")}
                  className="mt-0.5 h-4 w-4 text-[#005B97] focus:ring-2 focus:ring-[#005B97]/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">Grid View (Default)</span>
                    {viewMode === "grid" && (
                      <span className="inline-flex items-center rounded-full bg-[#005B97] px-2 py-0.5 text-xs font-medium text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Show the full grid of all stations with order counts and status indicators.
                  </p>
                </div>
              </label>

              {/* Station View Option */}
              <label
                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  viewMode === "station"
                    ? "border-[#005B97] bg-[#005B97]/5"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="viewMode"
                  value="station"
                  checked={viewMode === "station"}
                  onChange={(e) => setViewMode(e.target.value as "grid" | "station")}
                  className="mt-0.5 h-4 w-4 text-[#005B97] focus:ring-2 focus:ring-[#005B97]/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">Specific Station</span>
                    {viewMode === "station" && (
                      <span className="inline-flex items-center rounded-full bg-[#005B97] px-2 py-0.5 text-xs font-medium text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Redirect directly to a specific station view. Ideal for kiosk displays at
                    individual workstations.
                  </p>
                </div>
              </label>
            </div>

            {/* Station Dropdown - only shown when "station" mode is selected */}
            {viewMode === "station" && (
              <div className="pl-8 animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Station
                </label>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value as StationId)}
                  className="w-full max-w-sm rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#005B97] focus:ring-2 focus:ring-[#005B97]/20 focus:outline-none transition-colors min-h-[44px]"
                >
                  {STATIONS.map((station) => (
                    <option key={station} value={station}>
                      {STATION_LABELS[station]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  The dashboard will automatically redirect to /station/{selectedStation}
                </p>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005B97]/50"
                style={{
                  background:
                    "linear-gradient(180deg, #0069AD 0%, #005B97 50%, #004A7C 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,91,151,0.25), 0 0 12px rgba(0,91,151,0.1)",
                }}
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 mt-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-600">Note:</span> Changes are saved
                locally to this browser and take effect immediately. Each device/browser can have
                its own preference. Navigate to the home page (/) to test your preference.
              </p>
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
