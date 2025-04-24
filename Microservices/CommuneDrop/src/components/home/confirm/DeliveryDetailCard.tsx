"use client";

import type { ReactNode } from "react";

interface DeliveryDetailCardProps {
  icon: ReactNode;
  title: string;
  value: string;
}

export default function DeliveryDetailCard({
  icon,
  title,
  value,
}: DeliveryDetailCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        {icon}
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-gray-800 pl-8">{value}</p>
    </div>
  );
}
