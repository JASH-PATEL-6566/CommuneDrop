"use client";

import { useEffect, useRef } from "react";
import { mapService } from "../../../services/map-service";
import { useGoogleMaps } from "../../../context/GoogleMapsContext";

interface MapRouteProps {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  map: google.maps.Map | null;
  drawRoute: boolean;
  onRouteInfoChange?: (
    info: { distance: string; duration: string } | null
  ) => void;
  onRouteError?: (
    hasError: boolean,
    origin: string,
    destination: string
  ) => void;
}

export default function MapRoute({
  origin,
  destination,
  map,
  drawRoute,
  onRouteInfoChange,
  onRouteError,
}: MapRouteProps) {
  const mainPolylineRef = useRef<google.maps.Polyline | null>(null);
  const animatedPolylineRef = useRef<google.maps.Polyline | null>(null);
  const pulsePolylineRef = useRef<google.maps.Polyline | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pathRef = useRef<google.maps.LatLngLiteral[]>([]);
  const { google } = useGoogleMaps();

  useEffect(() => {
    if (!map || !google) {
      return;
    }

    const cleanup = () => {
      console.log("Cleaning up route polylines");
      if (mainPolylineRef.current) {
        mainPolylineRef.current.setMap(null);
        mainPolylineRef.current = null;
      }
      if (animatedPolylineRef.current) {
        animatedPolylineRef.current.setMap(null);
        animatedPolylineRef.current = null;
      }
      if (pulsePolylineRef.current) {
        pulsePolylineRef.current.setMap(null);
        pulsePolylineRef.current = null;
      }
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      pathRef.current = [];
      if (onRouteInfoChange) {
        onRouteInfoChange(null);
      }
    };
    cleanup();
    if (!drawRoute) {
      return;
    }

    const fetchDirections = async () => {
      try {
        const originStr =
          typeof origin === "string"
            ? origin
            : `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
        const destinationStr =
          typeof destination === "string"
            ? destination
            : `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
        const directionsResult = await mapService.getDirections(
          origin,
          destination
        );
        let pathCoordinates: google.maps.LatLngLiteral[] = [];
        if (directionsResult.path && directionsResult.path.length > 0) {
          pathCoordinates = directionsResult.path;
        } else if (
          directionsResult.route?.geometry &&
          Array.isArray(directionsResult.route.geometry)
        ) {
          pathCoordinates = directionsResult.route.geometry.map(
            (point: any[]) => ({
              lat: point[1],
              lng: point[0],
            })
          );
        } else {
          pathCoordinates = [
            typeof origin === "string" ? { lat: 0, lng: 0 } : origin,
            typeof destination === "string" ? { lat: 0, lng: 0 } : destination,
          ];
        }
        pathRef.current = pathCoordinates;
        const backgroundPolyline = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: "#000000",
          strokeOpacity: 0.6,
          strokeWeight: 5,
          map,
          zIndex: 1,
          strokeCap: "round",
          strokeJoin: "round",
        });
        const mainPolyline = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: "#000000",
          strokeOpacity: 0.9,
          strokeWeight: 6,
          map,
          zIndex: 2,
          strokeCap: "round",
          strokeJoin: "round",
        });
        mainPolylineRef.current = mainPolyline;
        const animatedPolyline = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: "#FFFFFF",
          strokeOpacity: 1,
          strokeWeight: 3,
          map,
          zIndex: 4,
          strokeCap: "round",
          strokeJoin: "round",
        });
        animatedPolylineRef.current = animatedPolyline;
        const glowPolyline = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: "#93c5fd",
          strokeOpacity: 0.6,
          strokeWeight: 10,
          map,
          zIndex: 3,
          strokeCap: "round",
          strokeJoin: "round",
        });
        pulsePolylineRef.current = glowPolyline;
        const animationDuration = 3000;
        let startTime: number | null = null;
        let lastPulseTime = 0;
        let pulseOpacity = 0.6;
        let pulseDirection = -1;
        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = (elapsed % animationDuration) / animationDuration;
          const pointCount = Math.max(
            2,
            Math.floor(pathCoordinates.length * progress)
          );
          const animatedPath = pathCoordinates.slice(0, pointCount);
          if (pointCount < pathCoordinates.length) {
            const lastPoint = pathCoordinates[pointCount - 1];
            const nextPoint = pathCoordinates[pointCount];
            const segmentProgress = (progress * pathCoordinates.length) % 1;
            if (google.maps.geometry && google.maps.geometry.spherical) {
              const interpolated = google.maps.geometry.spherical.interpolate(
                new google.maps.LatLng(lastPoint),
                new google.maps.LatLng(nextPoint),
                segmentProgress
              );
              animatedPath.push({
                lat: interpolated.lat(),
                lng: interpolated.lng(),
              });
            } else {
              const interpolatedPoint = {
                lat:
                  lastPoint.lat +
                  (nextPoint.lat - lastPoint.lat) * segmentProgress,
                lng:
                  lastPoint.lng +
                  (nextPoint.lng - lastPoint.lng) * segmentProgress,
              };
              animatedPath.push(interpolatedPoint);
            }
          }
          if (mainPolylineRef.current) {
            mainPolylineRef.current.setPath(animatedPath);
          }
          if (animatedPolylineRef.current) {
            const tipLength = Math.min(3, animatedPath.length);
            const tipPath = animatedPath.slice(animatedPath.length - tipLength);
            animatedPolylineRef.current.setPath(tipPath);
          }
          if (pulsePolylineRef.current && animatedPath.length > 0) {
            const glowLength = Math.min(5, animatedPath.length);
            const glowPath = animatedPath.slice(
              animatedPath.length - glowLength
            );
            pulsePolylineRef.current.setPath(glowPath);
            if (timestamp - lastPulseTime > 50) {
              pulseOpacity += 0.03 * pulseDirection;
              if (pulseOpacity <= 0.4) {
                pulseOpacity = 0.4;
                pulseDirection = 1;
              } else if (pulseOpacity >= 0.8) {
                pulseOpacity = 0.8;
                pulseDirection = -1;
              }
              pulsePolylineRef.current.setOptions({
                strokeOpacity: pulseOpacity,
              });
              lastPulseTime = timestamp;
            }
          }
          animationFrameRef.current = window.requestAnimationFrame(animate);
        };
        animationFrameRef.current = window.requestAnimationFrame(animate);
        if (onRouteInfoChange) {
          if (
            directionsResult.distance?.text &&
            directionsResult.duration?.text
          ) {
            onRouteInfoChange({
              distance: directionsResult.distance.text || "Unknown",
              duration: directionsResult.duration.text || "Unknown",
            });
          } else if (directionsResult.summary) {
            onRouteInfoChange({
              distance: `${directionsResult.summary.distance} km` || "Unknown",
              duration:
                `${directionsResult.summary.durationMinutes} mins` || "Unknown",
            });
          } else {
            onRouteInfoChange(null);
          }
        }
        if (onRouteError) {
          onRouteError(false, originStr, destinationStr);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        if (onRouteInfoChange) {
          onRouteInfoChange(null);
        }
        if (onRouteError) {
          const originStr =
            typeof origin === "string"
              ? origin
              : `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
          const destinationStr =
            typeof destination === "string"
              ? destination
              : `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
          onRouteError(true, originStr, destinationStr);
        }
      }
    };

    if (drawRoute) {
      fetchDirections();
    }
    return cleanup;
  }, [
    map,
    origin,
    destination,
    drawRoute,
    onRouteInfoChange,
    onRouteError,
    google,
  ]);

  return null;
}
