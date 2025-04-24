"use client";

import { MapPin, Clock } from "lucide-react";

interface RouteInfoProps {
  distance: string;
  duration: string;
}

export default function RouteInfo({ distance, duration }: RouteInfoProps) {
  return (
    <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg z-10 max-w-xs border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <span className="font-medium text-gray-900">Route Information</span>
      </div>
      <div className="space-y-3 pl-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">A</span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Distance:</span> {distance}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 text-gray-600" />
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Duration:</span> {duration}
          </div>
        </div>
      </div>
    </div>
  );
}
