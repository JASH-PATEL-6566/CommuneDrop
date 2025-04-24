"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { mapService, type GeocodingResult } from "../services/map-service";

interface UseGeocodingProps {
  initialAddress?: string;
  autoGeocode?: boolean;
  debounceMs?: number;
}

export function useGeocoding({
  initialAddress,
  autoGeocode = false,
  debounceMs = 800,
}: UseGeocodingProps = {}) {
  const [address, setAddress] = useState(initialAddress || "");
  const [result, setResult] = useState<GeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const geocodeRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const geocode = useCallback(
    async (addressToGeocode?: string) => {
      const addressToUse = addressToGeocode || address;
      const requestId = ++geocodeRequestIdRef.current;

      if (!addressToUse.trim()) {
        setError("Address is required");
        setResult(null);
        setIsLoading(false);
        return null;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const province = "Nova Scotia";
        const geocodingResult = await mapService.geocodeAddress(
          addressToUse,
          // @ts-ignore
          province
        );

        if (
          !isMountedRef.current ||
          requestId !== geocodeRequestIdRef.current
        ) {
          return null;
        }

        if (geocodingResult.latitude === 0 && geocodingResult.longitude === 0) {
          setError("Could not find coordinates for this address");
          setResult(null);
          return null;
        } else {
          setResult(geocodingResult);
          setError(null);
          return geocodingResult;
        }
      } catch (err) {
        if (!isMountedRef.current || requestId !== geocodeRequestIdRef.current)
          return null;

        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during geocoding"
        );
        setResult(null);
        return null;
      } finally {
        if (isMountedRef.current && requestId === geocodeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [address]
  );

  const debouncedGeocode = useCallback(
    (addressToGeocode?: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        geocode(addressToGeocode);
      }, debounceMs);
    },
    [geocode, debounceMs]
  );

  useEffect(() => {
    if (initialAddress && autoGeocode) {
      setAddress(initialAddress);
      debouncedGeocode(initialAddress);
    }
  }, [initialAddress, autoGeocode, debouncedGeocode]);

  const updateAddress = useCallback(
    (newAddress: string) => {
      setAddress(newAddress);

      if (newAddress.trim()) {
        setIsLoading(true);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          geocode(newAddress);
        }, debounceMs);
      } else {
        setResult(null);
        setIsLoading(false);
      }
    },
    [geocode, debounceMs]
  );

  return {
    address,
    setAddress: updateAddress,
    geocode,
    debouncedGeocode,
    result,
    isLoading,
    error,
    coordinates: result
      ? { lat: result.latitude, lng: result.longitude }
      : undefined,
  };
}
