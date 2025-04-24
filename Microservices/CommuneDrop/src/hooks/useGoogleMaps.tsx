"use client";

import { useGoogleMaps as useGoogleMapsContext } from "../context/GoogleMapsContext";

export function useGoogleMaps() {
  return useGoogleMapsContext();
}
