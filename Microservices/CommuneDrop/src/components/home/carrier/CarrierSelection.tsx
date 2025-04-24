"use client";

import { useMemo, useState, useEffect } from "react";

interface CarrierSelectionProps {
  selectedCarrier: string;
  onChange: (carrier: string) => void;
}

export default function CarrierSelection({
  selectedCarrier,
  onChange,
}: CarrierSelectionProps) {
  // Track if animations have been loaded
  const [animationsLoaded, setAnimationsLoaded] = useState(false);

  // Load animations when component mounts
  useEffect(() => {
    // Set a small delay to ensure animations are loaded
    const timer = setTimeout(() => {
      setAnimationsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const carriers = useMemo(
    () => [
      {
        type: "car",
        iconSrc: "/icons/animated-car.gif",
        label: "Car",
        bgColor: "bg-blue-50",
        textColor: "text-blue-500",
      },
      {
        type: "truck",
        iconSrc: "/icons/animated-truck.gif",
        label: "Truck",
        bgColor: "bg-green-50",
        textColor: "text-green-500",
      },
      {
        type: "bike",
        iconSrc: "/icons/animated-bike.gif",
        label: "Bike",
        bgColor: "bg-purple-50",
        textColor: "text-purple-500",
      },
      {
        type: "walk",
        iconSrc: "/icons/animated-box.gif",
        label: "Walk",
        bgColor: "bg-orange-50",
        textColor: "text-orange-500",
      },
    ],
    []
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 ml-1">Select carrier type:</p>
      <div className="grid grid-cols-2 gap-2">
        {carriers.map((carrier) => {
          const isSelected = selectedCarrier === carrier.type;
          return (
            <button
              key={carrier.type}
              onClick={() => onChange(carrier.type)}
              className={`p-3 rounded-lg flex items-center justify-center space-x-2 transition-all
              border-2 ${
                isSelected
                  ? `border-primary ${carrier.bgColor} ${carrier.textColor}`
                  : "border-gray-200 hover:border-primary/30 text-gray-800"
              }`}
              aria-pressed={isSelected}
            >
              <div className="p-2">
                <img
                  src={carrier.iconSrc || "/placeholder.svg"}
                  alt={carrier.label}
                  className="w-10 h-10 object-contain"
                  style={{
                    opacity: animationsLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out",
                  }}
                />
              </div>
              <span className="text-sm">{carrier.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
