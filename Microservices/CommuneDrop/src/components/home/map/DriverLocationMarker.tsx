"use client";

import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "../../../context/GoogleMapsContext";

interface DriverLocationMarkerProps {
  position: { lat: number; lng: number };
  heading?: number;
  map: google.maps.Map | null;
}

export default function DriverLocationMarker({
  position,
  heading = 0,
  map,
}: DriverLocationMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { google } = useGoogleMaps();
  const animationFrameRef = useRef<number>(0);
  const [pulseCircle, setPulseCircle] = useState<google.maps.Marker | null>(
    null
  );

  useEffect(() => {
    if (!map || !google) return;

    // Clean up previous marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    if (pulseCircle) {
      pulseCircle.setMap(null);
    }

    // Create driver marker with custom icon
    const driverIcon = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      fillColor: "#4f46e5", // Indigo color for driver
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2,
      scale: 8,
      rotation: heading, // Use the heading to rotate the arrow
    };

    // Create a pulsing circle around the driver
    const newPulseCircle = new google.maps.Marker({
      position,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#4f46e5",
        fillOpacity: 0.3,
        strokeColor: "#4f46e5",
        strokeWeight: 1,
        scale: 16,
      },
      zIndex: 1,
    });

    setPulseCircle(newPulseCircle);

    // Create the driver marker
    const marker = new google.maps.Marker({
      position,
      map,
      icon: driverIcon,
      zIndex: 2,
      title: "Driver Location",
    });

    markerRef.current = marker;

    // Animate the pulse effect
    let scale = 16;
    let increasing = false;
    const animatePulse = () => {
      if (increasing) {
        scale += 0.2;
        if (scale >= 20) {
          increasing = false;
        }
      } else {
        scale -= 0.2;
        if (scale <= 16) {
          increasing = true;
        }
      }

      if (newPulseCircle) {
        newPulseCircle.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#4f46e5",
          fillOpacity: 0.3,
          strokeColor: "#4f46e5",
          strokeWeight: 1,
          scale: scale,
        });
      }

      animationFrameRef.current = window.requestAnimationFrame(animatePulse);
    };

    animationFrameRef.current = window.requestAnimationFrame(animatePulse);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (newPulseCircle) {
        newPulseCircle.setMap(null);
      }
    };
  }, [map, position, heading, google]);

  return null;
}
