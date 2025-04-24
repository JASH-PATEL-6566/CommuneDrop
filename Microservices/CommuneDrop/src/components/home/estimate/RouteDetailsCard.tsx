"use client";

import { MapPin } from "lucide-react";

interface RouteDetailsCardProps {
  pickup: string;
  dropoff: string;
}

export default function RouteDetailsCard({
  pickup,
  dropoff,
}: RouteDetailsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 mb-4">Route Details</p>
          <div className="relative space-y-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="flex items-start gap-4 relative">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              <div>
                <p className="font-medium text-gray-900">Pickup</p>
                <p className="text-sm text-gray-600">{pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 relative">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm" />
              <div>
                <p className="font-medium text-gray-900">Dropoff</p>
                <p className="text-sm text-gray-600">{dropoff}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
