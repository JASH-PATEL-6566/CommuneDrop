"use client";

import { AlertTriangle } from "lucide-react";

interface NoRouteMessageProps {
  origin: string;
  destination: string;
}

export default function NoRouteMessage({
  origin,
  destination,
}: NoRouteMessageProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg max-w-md text-center pointer-events-auto">
        <div className="flex justify-center mb-2">
          <AlertTriangle className="text-amber-500 w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Route Available
        </h3>
        <p className="text-gray-600 mb-3">
          We couldn't find a valid route between these locations:
        </p>
        <div className="bg-gray-50 p-2 rounded mb-3 text-sm">
          <div className="font-medium">
            From: <span className="font-normal">{origin}</span>
          </div>
          <div className="font-medium">
            To: <span className="font-normal">{destination}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          This may be because the locations are too far apart, across water, or
          not connected by roads.
        </p>
      </div>
    </div>
  );
}
