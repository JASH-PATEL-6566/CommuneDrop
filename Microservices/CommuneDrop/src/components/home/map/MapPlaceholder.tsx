"use client";

import { MapPin } from "lucide-react";
import MapBackground from "./MapBackground";

export default function MapPlaceholder() {
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <MapBackground />
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-opacity-60 backdrop-blur-sm">
        <div className="text-center p-8 bg-white bg-opacity-80 rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Enter a location
          </h3>
          <p className="text-gray-600 max-w-xs mx-auto">
            Start typing a pickup or dropoff location to see it on the map
          </p>
        </div>
      </div>
    </div>
  );
}
