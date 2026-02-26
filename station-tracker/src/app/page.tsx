"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { STATIONS, type StationId } from "@/lib/types";
import DashboardClient from "./DashboardClient";

interface DefaultViewPreference {
  mode: "grid" | "station";
  stationId?: StationId;
}

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for default view preference
    const preferenceRaw = localStorage.getItem("default_view_preference");

    if (preferenceRaw) {
      try {
        const preference: DefaultViewPreference = JSON.parse(preferenceRaw);

        // If set to a specific station, redirect there
        if (preference.mode === "station" && preference.stationId) {
          // Validate station exists to prevent broken redirects
          if (STATIONS.includes(preference.stationId)) {
            router.push(`/station/${preference.stationId}`);
          }
        }
      } catch (e) {
        // Invalid JSON, fall through to default grid view
        console.error("Invalid preference JSON:", e);
      }
    }
  }, [router]);

  // Default: render the grid view
  return <DashboardClient />;
}
