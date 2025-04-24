"use client";

import { Receipt } from "lucide-react";

interface FareBreakdownProps {
  fare: {
    base: number;
    distance: number;
    time: number;
    total: number;
    currency: string;
  };
  distance: string;
}

export default function FareBreakdown({ fare, distance }: FareBreakdownProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-primary" />
          <span className="font-semibold text-gray-900">Fare Breakdown</span>
        </div>
        <span className="text-xl font-bold text-primary">
          ${fare.total.toFixed(2)}
        </span>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
          <span className="text-gray-600">Base Fare</span>
          <span className="font-medium text-gray-900">
            ${fare.base.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
          <span className="text-gray-600">Distance ({distance})</span>
          <span className="font-medium text-gray-900">
            ${fare.distance.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Time</span>
          <span className="font-medium text-gray-900">
            ${fare.time.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
