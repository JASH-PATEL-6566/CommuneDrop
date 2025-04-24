"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGoogleMaps } from "../../context/GoogleMapsContext";
import { useLocation } from "../../context/LocationContext";
import { useTracking } from "../../context/TrackingContext";
import { Loader } from "lucide-react";
import type { Position } from "../../hooks/useLocationState";
import MapMarker from "./map/MapMarker";
import MapRoute from "./map/MapRoute";
import RouteInfo from "./map/RouteInfo";
import NoRouteMessage from "./map/NoRouteMessage";
import MapPlaceholder from "./map/MapPlaceholder";
import DriverLocationMarker from "./map/DriverLocationMarker";
import OrderStatusBanner from "./map/OrderStatusBanner";

interface MapProps {
  positions: Position[];
  center: Position;
  drawRoute?: boolean;
  hasEnteredLocations?: boolean;
  isLoading?: boolean;
}

export default function Map({
  positions,
  center,
  drawRoute = true,
  hasEnteredLocations = false,
  isLoading = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [noRouteFound, setNoRouteFound] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState("");
  const [routeDestination, setRouteDestination] = useState("");
  const { setRouteInfo, routeInfo } = useLocation();
  const { google, isLoading: isMapLoading, error } = useGoogleMaps();
  const { isTracking, driverLocation, orderStatus } = useTracking();

  useEffect(() => {
    if (!google || !mapRef.current || googleMapRef.current) return;

    console.log("Initializing map with Google Maps API");

    try {
      const mapOptions = {
        center: center,
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        styles: [],
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: "cooperative",
        disableDefaultUI: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;
      setMapInitialized(true);

      console.log("Map initialized successfully");
    } catch (err) {
      console.error("Error initializing map:", err);
    }
  }, [google, center]);

  useEffect(() => {
    if (!google || !googleMapRef.current) return;

    try {
      if (positions.length === 0) {
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      positions.forEach((pos) => bounds.extend(pos));

      // If we have a driver location, include it in the bounds
      if (isTracking && driverLocation) {
        bounds.extend(driverLocation);
      }

      googleMapRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
      if (positions.length === 1 && !driverLocation) {
        googleMapRef.current.setCenter(positions[0]);
        googleMapRef.current.setZoom(15);
      }
      if (positions.length > 1 && !routeInfo && drawRoute) {
        setMapInitialized((prev) => {
          if (prev) return prev;
          return true;
        });
      }
    } catch (err) {
      console.error("Error updating map bounds:", err);
    }
  }, [google, positions, routeInfo, drawRoute, isTracking, driverLocation]);

  const handleRouteInfoChange = useCallback(
    (info: { distance: string; duration: string } | null) => {
      setRouteInfo(info);
    },
    [setRouteInfo]
  );

  const handleRouteError = useCallback(
    (hasError: boolean, origin: string, destination: string) => {
      setNoRouteFound(hasError);
      setRouteOrigin(origin);
      setRouteDestination(destination);
    },
    []
  );

  if (isMapLoading || !google) {
    return (
      <div
        className="relative w-full h-full rounded-lg flex items-center justify-center bg-gray-100"
        style={{ minHeight: "500px" }}
      >
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 text-primary animate-spin" />
          <p className="mt-2 text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="relative w-full h-full rounded-lg flex items-center justify-center bg-red-50"
        style={{ minHeight: "500px" }}
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="mt-2 text-sm text-gray-600">
            Please check your Google Maps API key and internet connection.
          </p>
        </div>
      </div>
    );
  }

  if (!hasEnteredLocations) {
    return <MapPlaceholder />;
  }

  if (isLoading) {
    return (
      <div
        className="relative w-full h-full rounded-lg flex items-center justify-center bg-gray-100"
        style={{ minHeight: "500px" }}
      >
        <div className="flex flex-col items-center">
          <Loader className="w-10 h-10 text-primary animate-spin" />
          <p className="mt-2 text-gray-600">Calculating route...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "500px" }}
    >
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ height: "100%", minHeight: "500px" }}
        aria-label="Map showing delivery route"
        role="application"
      />

      {/* Display order status banner if tracking */}
      {isTracking && orderStatus && <OrderStatusBanner status={orderStatus} />}

      {googleMapRef.current &&
        mapInitialized &&
        positions.map((position, index) => (
          <MapMarker
            key={`marker-${index}-${position.lat}-${position.lng}`}
            position={position}
            map={googleMapRef.current}
            index={index}
            type={index === 0 ? "pickup" : "dropoff"}
          />
        ))}

      {googleMapRef.current &&
        mapInitialized &&
        positions.length > 1 &&
        drawRoute && (
          <MapRoute
            key={`route-${positions.length}-${positions[0]?.lat}-${
              positions[0]?.lng
            }-${positions[positions.length - 1]?.lat}-${
              positions[positions.length - 1]?.lng
            }`}
            origin={positions[0]}
            destination={positions[positions.length - 1]}
            map={googleMapRef.current}
            drawRoute={drawRoute}
            onRouteInfoChange={handleRouteInfoChange}
            onRouteError={handleRouteError}
          />
        )}

      {/* Display driver location marker if tracking */}
      {googleMapRef.current &&
        mapInitialized &&
        isTracking &&
        driverLocation && (
          <DriverLocationMarker
            position={driverLocation}
            heading={driverLocation.heading}
            map={googleMapRef.current}
          />
        )}

      {routeInfo && !noRouteFound && positions.length > 1 && drawRoute && (
        <RouteInfo
          distance={routeInfo.distance}
          duration={routeInfo.duration}
        />
      )}

      {noRouteFound && positions.length > 1 && drawRoute && (
        <NoRouteMessage origin={routeOrigin} destination={routeDestination} />
      )}
    </div>
  );
}
