"use client";

import { MapPin } from "lucide-react";

interface DeliveryLocationCardProps {
  type: "pickup" | "dropoff";
  address: string;
}

export default function DeliveryLocationCard({
  type,
  address,
}: DeliveryLocationCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        <MapPin className="w-5 h-5 mr-3 text-primary" />
        <p className="font-medium">
          {type === "pickup" ? "Pickup Location" : "Dropoff Location"}
        </p>
      </div>
      <p className="text-gray-800 pl-8">{address}</p>
    </div>
  );
}
