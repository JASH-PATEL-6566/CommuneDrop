"use client";

import { ArrowRight, Loader } from "lucide-react";

interface CalculateButtonProps {
  isValid: boolean;
  isLoading: boolean;
  pickupAddress: string;
  dropoffAddress: string;
  hasPickupCoordinates: boolean;
  hasDropoffCoordinates: boolean;
  onClick: () => void;
}

export default function CalculateButton({
  isLoading,
  pickupAddress,
  dropoffAddress,
  onClick,
}: CalculateButtonProps) {
  const shouldEnable =
    pickupAddress.trim().length > 0 && dropoffAddress.trim().length > 0;

  return (
    <button
      className={`w-full py-4 rounded-lg mt-6 text-sm font-medium transition-colors flex items-center justify-center
      ${
        shouldEnable
          ? "bg-black text-white hover:bg-gray-900"
          : "bg-gray-200 text-gray-500 cursor-not-allowed"
      }`}
      onClick={onClick}
      disabled={!shouldEnable || isLoading}
      aria-disabled={!shouldEnable || isLoading}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : !pickupAddress && !dropoffAddress ? (
        <>Enter Locations</>
      ) : !pickupAddress || !dropoffAddress ? (
        <>Enter Both Locations</>
      ) : (
        <>
          Calculate Route & Continue
          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
