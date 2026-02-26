"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATIONS, type StationId } from "@/lib/types";

interface DefaultViewPreference {
  mode: "grid" | "station";
  stationId?: StationId;
}

interface SmartLogoLinkProps {
  imgClassName: string;
  alt?: string;
  linkClassName?: string;
}

export default function SmartLogoLink({
  imgClassName,
  alt = "Skyco",
  linkClassName,
}: SmartLogoLinkProps) {
  const [href, setHref] = useState("/");

  useEffect(() => {
    try {
      const preferenceRaw = localStorage.getItem("default_view_preference");
      if (!preferenceRaw) return;

      const preference: DefaultViewPreference = JSON.parse(preferenceRaw);
      if (
        preference.mode === "station" &&
        preference.stationId &&
        STATIONS.includes(preference.stationId)
      ) {
        setHref(`/station/${preference.stationId}`);
      }
    } catch {
      // Ignore invalid or missing preference JSON
    }
  }, []);

  return (
    <Link href={href} className={linkClassName} aria-label="Go to default view">
      <img src="/skyco-logo.svg" alt={alt} className={imgClassName} />
    </Link>
  );
}
