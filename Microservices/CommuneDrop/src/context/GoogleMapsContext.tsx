"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { API_CONFIG } from "../config/api-config";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapsContextProps {
  google: any | null;
  isLoading: boolean;
  error: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextProps>({
  google: null,
  isLoading: true,
  error: null,
});

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
}) => {
  const [googleMaps, setGoogleMaps] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps API already loaded");
      setGoogleMaps(window.google);
      setIsLoading(false);
      return;
    }

    // Load Google Maps API
    const loadGoogleMaps = () => {
      console.log(
        "Loading Google Maps API with key:",
        API_CONFIG.MAPS_API_KEY ? "Key provided" : "No key provided"
      );

      if (!API_CONFIG.MAPS_API_KEY) {
        console.error(
          "No Google Maps API key provided. Check your environment variables."
        );
        setError(
          "Google Maps API key is missing. Please check your configuration."
        );
        setIsLoading(false);
        return;
      }

      const googleMapScript = document.createElement("script");
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${API_CONFIG.MAPS_API_KEY}&libraries=places`;
      googleMapScript.async = true;
      googleMapScript.defer = true;

      googleMapScript.onload = () => {
        console.log("Google Maps API loaded successfully");
        setGoogleMaps(window.google);
        setIsLoading(false);
      };

      googleMapScript.onerror = () => {
        console.error("Failed to load Google Maps API");
        setError(
          "Failed to load Google Maps. Please check your internet connection and API key."
        );
        setIsLoading(false);
      };

      document.body.appendChild(googleMapScript);
    };

    loadGoogleMaps();

    // Cleanup
    return () => {
      // Nothing to clean up here as we don't want to remove the script once loaded
    };
  }, []);

  return (
    <GoogleMapsContext.Provider
      value={{ google: googleMaps, isLoading, error }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};
