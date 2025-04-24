"use client";

import { Clock } from "lucide-react";

interface EstimatedTimeCardProps {
  estimatedTime: string;
}

export default function EstimatedTimeCard({
  estimatedTime,
}: EstimatedTimeCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Estimated Time</p>
          <p className="text-lg font-semibold text-gray-900">{estimatedTime}</p>
        </div>
      </div>
    </div>
  );
}
