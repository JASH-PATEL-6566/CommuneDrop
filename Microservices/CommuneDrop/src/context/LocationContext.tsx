"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLocationState, type Position } from "../hooks/useLocationState";

interface LocationContextType {
  pickup: string;
  dropoff: string;
  pickupCoordinates?: Position;
  dropoffCoordinates?: Position;
  mapPositions: Position[];
  mapCenter: Position;
  hasEnteredLocations: boolean;
  isLoadingMap: boolean;
  showRoute: boolean;
  routeInfo: {
    distance: string;
    duration: string;
  } | null;
  setPickup: (address: string) => Promise<void>;
  setDropoff: (address: string) => Promise<void>;
  setPickupCoordinates: (coordinates: Position | undefined) => void;
  setDropoffCoordinates: (coordinates: Position | undefined) => void;
  calculateRoute: () => Promise<void>;
  setShowRoute: (show: boolean) => void;
  resetLocations: () => void; // Add this function
  setRouteInfo: (info: { distance: string; duration: string } | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export function LocationProvider({ children }: { children: ReactNode }) {
  const locationState = useLocationState();

  return (
    <LocationContext.Provider value={locationState}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
