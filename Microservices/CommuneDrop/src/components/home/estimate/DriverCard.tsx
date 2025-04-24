"use client";

import { Star, Phone } from "lucide-react";

interface DriverCardProps {
  driver: {
    name: string;
    rating: number;
    trips: number;
    vehicleType: string;
    vehicleNumber: string;
    image: string;
  };
}

export default function DriverCard({ driver }: DriverCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={driver.image || "/placeholder.svg?height=100&width=100"}
            alt={driver.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary"
          />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {driver.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm ml-1 font-medium">
                    {driver.rating}
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">
                  {driver.trips} trips
                </span>
              </div>
            </div>
            <button className="bg-primary text-white p-3 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              <Phone className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {driver.vehicleType}
                </p>
                <p className="text-sm text-gray-600">{driver.vehicleNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
