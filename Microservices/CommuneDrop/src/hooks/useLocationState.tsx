"use client";

import { useState, useCallback, useEffect } from "react";
import { serviceFactory } from "../services/service-factory";

export interface LocationState {
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
}

export interface Position {
  lat: number;
  lng: number;
}

export function useLocationState() {
  const defaultCenter = { lat: 44.6488, lng: -63.5752 };
  const mapServiceInstance = serviceFactory.getMapService();
  const [state, setState] = useState<LocationState>({
    pickup: "",
    dropoff: "",
    pickupCoordinates: undefined,
    dropoffCoordinates: undefined,
    mapPositions: [],
    mapCenter: defaultCenter,
    hasEnteredLocations: false,
    isLoadingMap: false,
    showRoute: false,
    routeInfo: null,
  });

  const geocodeAddress = useCallback(
    async (address: string): Promise<Position | undefined> => {
      if (!address || address.trim().length === 0) return undefined;
      try {
        console.log(`Geocoding address: "${address}"`);
        const result = await mapServiceInstance.geocodeAddress(address);
        console.log("Geocoding result:", result);
        if (result.latitude !== 0 && result.longitude !== 0) {
          return {
            lat: result.latitude,
            lng: result.longitude,
          };
        }
        return undefined;
      } catch (error) {
        console.error("Error geocoding address:", error);
        return undefined;
      }
    },
    [mapServiceInstance]
  );

  const setPickup = useCallback(async (address: string) => {
    setState((prev) => ({
      ...prev,
      pickup: address,
      ...(address.trim() === ""
        ? {
            pickupCoordinates: undefined,
            showRoute: false,
            routeInfo: null,
          }
        : {}),
    }));
  }, []);

  const setDropoff = useCallback(async (address: string) => {
    setState((prev) => ({
      ...prev,
      dropoff: address,
      ...(address.trim() === ""
        ? {
            dropoffCoordinates: undefined,
            showRoute: false,
            routeInfo: null,
          }
        : {}),
    }));
  }, []);

  const setPickupCoordinates = useCallback(
    (coordinates: Position | undefined) => {
      setState((prev) => ({
        ...prev,
        pickupCoordinates: coordinates,
        hasEnteredLocations: prev.hasEnteredLocations || !!coordinates,
        ...(coordinates === undefined
          ? {
              showRoute: false,
              routeInfo: null,
            }
          : {}),
      }));
    },
    []
  );

  const setDropoffCoordinates = useCallback(
    (coordinates: Position | undefined) => {
      setState((prev) => ({
        ...prev,
        dropoffCoordinates: coordinates,
        hasEnteredLocations: prev.hasEnteredLocations || !!coordinates,
        ...(coordinates === undefined
          ? {
              showRoute: false,
              routeInfo: null,
            }
          : {}),
      }));
    },
    []
  );

  useEffect(() => {
    const updateMapPositions = () => {
      const newPositions: Position[] = [];
      if (state.pickupCoordinates) {
        newPositions.push(state.pickupCoordinates);
      }
      if (state.dropoffCoordinates) {
        newPositions.push(state.dropoffCoordinates);
      }
      let newCenter = state.mapCenter;
      if (newPositions.length === 1) {
        newCenter = newPositions[0];
      } else if (newPositions.length === 2) {
        newCenter = {
          lat: (newPositions[0].lat + newPositions[1].lat) / 2,
          lng: (newPositions[0].lng + newPositions[1].lng) / 2,
        };
      }
      setState((prev) => ({
        ...prev,
        mapPositions: newPositions,
        mapCenter: newCenter,
      }));
    };
    updateMapPositions();
  }, [state.pickupCoordinates, state.dropoffCoordinates]);

  const setShowRoute = useCallback((show: boolean) => {
    setState((prev) => {
      if (!show) {
        return { ...prev, showRoute: false, routeInfo: null };
      }
      return { ...prev, showRoute: show };
    });
  }, []);

  const calculateRoute = useCallback(async () => {
    console.log("Calculating route");
    if (!state.pickup && !state.dropoff) {
      console.warn("Cannot calculate route: no locations provided");
      return;
    }
    setState((prev) => ({
      ...prev,
      hasEnteredLocations: true,
      isLoadingMap: true,
    }));
    try {
      if (state.pickup && !state.pickupCoordinates) {
        const pickupCoords = await geocodeAddress(state.pickup);
        if (pickupCoords) {
          setState((prev) => ({ ...prev, pickupCoordinates: pickupCoords }));
        }
      }
      if (state.dropoff && !state.dropoffCoordinates) {
        const dropoffCoords = await geocodeAddress(state.dropoff);
        if (dropoffCoords) {
          setState((prev) => ({ ...prev, dropoffCoordinates: dropoffCoords }));
        }
      }
      setState((prev) => ({ ...prev, showRoute: true }));
    } catch (error) {
      console.error("Error calculating route:", error);
    } finally {
      setState((prev) => ({ ...prev, isLoadingMap: false }));
    }
  }, [
    state.pickup,
    state.dropoff,
    state.pickupCoordinates,
    state.dropoffCoordinates,
    geocodeAddress,
  ]);

  const resetLocations = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pickup: "",
      dropoff: "",
      pickupCoordinates: undefined,
      dropoffCoordinates: undefined,
      mapPositions: [],
      mapCenter: defaultCenter,
      hasEnteredLocations: false,
      showRoute: false,
      routeInfo: null,
    }));
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }, [defaultCenter]);
  const setRouteInfo = useCallback(
    (info: { distance: string; duration: string } | null) => {
      setState((prev) => ({ ...prev, routeInfo: info }));
    },
    []
  );
  useEffect(() => {
    if (!state.pickupCoordinates || !state.dropoffCoordinates) {
      setState((prev) => ({
        ...prev,
        showRoute: false,
        routeInfo: null,
      }));
    }
  }, [state.mapPositions]);
  const handlePickupChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      pickup: value,
      ...(value.trim() === ""
        ? {
            pickupCoordinates: undefined,
            showRoute: false,
            routeInfo: null,
            mapPositions: prev.dropoffCoordinates
              ? [prev.dropoffCoordinates]
              : [],
          }
        : {}),
    }));
  }, []);

  const handleDropoffChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      dropoff: value,
      ...(value.trim() === ""
        ? {
            dropoffCoordinates: undefined,
            showRoute: false,
            routeInfo: null,
            mapPositions: prev.pickupCoordinates
              ? [prev.pickupCoordinates]
              : [],
          }
        : {}),
    }));
  }, []);
  return {
    ...state,
    setPickup,
    setDropoff,
    setPickupCoordinates,
    setDropoffCoordinates,
    calculateRoute,
    setShowRoute,
    resetLocations,
    setRouteInfo,
    handlePickupChange,
    handleDropoffChange,
  };
}
