"use client";

interface FormValidationMessageProps {
  isValid: boolean;
  pickupAddress: string;
  dropoffAddress: string;
  hasPickupCoordinates: boolean;
  hasDropoffCoordinates: boolean;
}

export default function FormValidationMessage({
  isValid,
  pickupAddress,
  dropoffAddress,
  hasPickupCoordinates,
  hasDropoffCoordinates,
}: FormValidationMessageProps) {
  if (isValid) {
    return (
      <p className="text-xs text-gray-500 text-center mt-2">
        Click to calculate and view route
      </p>
    );
  }
  if (!pickupAddress && !dropoffAddress) {
    return (
      <p className="text-xs text-gray-500 text-center mt-2">
        Enter dropoff location to continue
      </p>
    );
  }
  if (!pickupAddress) {
    return (
      <p className="text-xs text-gray-500 text-center mt-2">
        Enter pickup location to continue
      </p>
    );
  }
  if (!hasPickupCoordinates || !hasDropoffCoordinates) {
    return (
      <p className="text-xs text-gray-500 text-center mt-2">
        Please enter valid locations that can be found on the map
      </p>
    );
  }
  return (
    <p className="text-xs text-gray-500 text-center mt-2">
      Click to calculate and view route
    </p>
  );
}
