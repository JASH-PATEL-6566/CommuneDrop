"use client";

import { motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import type { DeliveryFormData } from "./DeliveryFlow";
import { useLocation } from "../../context/LocationContext";
import { useOrder } from "../../context/OrderContext";
import LocationInput from "./location/LocationInput";
import WeightInput from "./weight/WeightInput";
import CarrierSelection from "./carrier/CarrierSelection";
import CalculateButton from "./buttons/CalculateButton";
import FormValidationMessage from "./validation/FormValidationMessage";
import { useLoadingState } from "../../hooks/useLoadingState";

interface SearchFormProps {
  formData: DeliveryFormData;
  onFormDataChange: (field: string, value: any) => void;
  onNext: () => void;
  onLocationUpdate?: (pickup: string, dropoff: string) => void;
}

export default function SearchForm({
  formData,
  onFormDataChange,
  onNext,
  onLocationUpdate,
}: SearchFormProps) {
  const {
    pickup,
    dropoff,
    pickupCoordinates,
    dropoffCoordinates,
    setPickup,
    setDropoff,
    setPickupCoordinates,
    setDropoffCoordinates,
    setShowRoute,
  } = useLocation();

  const { setOrderDetails } = useOrder();

  const { isLoading } = useLoadingState([
    "pickupSuggestions",
    "dropoffSuggestions",
    "geocoding",
  ]);

  // Add a function to reset showRoute when location changes
  const handlePickupChange = useCallback(
    (value: string) => {
      setPickup(value);
      setShowRoute(false);
      setOrderDetails({ pickup: value });

      if (onLocationUpdate) {
        onLocationUpdate(value, dropoff);
      }
      // Clear coordinates if input is empty
      if (!value.trim()) {
        setPickupCoordinates(undefined);
        setOrderDetails({ pickupCoordinates: undefined });
      }
    },
    [
      setPickup,
      dropoff,
      onLocationUpdate,
      setShowRoute,
      setPickupCoordinates,
      setOrderDetails,
    ]
  );

  // Update the handleDropoffChange function to reset showRoute
  const handleDropoffChange = useCallback(
    (value: string) => {
      setDropoff(value);
      setShowRoute(false);
      setOrderDetails({ dropoff: value });

      if (onLocationUpdate) {
        onLocationUpdate(pickup, value);
      }
      // Clear coordinates if input is empty
      if (!value.trim()) {
        setDropoffCoordinates(undefined);
        setOrderDetails({ dropoffCoordinates: undefined });
      }
    },
    [
      setDropoff,
      pickup,
      onLocationUpdate,
      setShowRoute,
      setDropoffCoordinates,
      setOrderDetails,
    ]
  );

  // Add handlers for coordinate changes to also reset showRoute
  const handlePickupCoordinatesChange = useCallback(
    (coordinates: { lat: number; lng: number } | undefined) => {
      setPickupCoordinates(coordinates);
      setOrderDetails({ pickupCoordinates: coordinates });
      setShowRoute(false);
    },
    [setPickupCoordinates, setShowRoute, setOrderDetails]
  );

  const handleDropoffCoordinatesChange = useCallback(
    (coordinates: { lat: number; lng: number } | undefined) => {
      setDropoffCoordinates(coordinates);
      setOrderDetails({ dropoffCoordinates: coordinates });
      setShowRoute(false);
    },
    [setDropoffCoordinates, setShowRoute, setOrderDetails]
  );

  const isFormValid = useMemo(() => {
    const hasPickupAddress = pickup.trim().length > 0;
    const hasDropoffAddress = dropoff.trim().length > 0;
    return hasPickupAddress && hasDropoffAddress;
  }, [pickup, dropoff]);

  const isLoadingData = useMemo(() => {
    return (
      isLoading("pickupSuggestions") ||
      isLoading("dropoffSuggestions") ||
      isLoading("geocoding")
    );
  }, [isLoading]);

  return (
    <motion.div
      key="search"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <h2 className="text-[32px] font-bold text-gray-800 mb-4">
        Deliver a package
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Have a courier deliver something for you. Get packages delivered in the
        time it takes to drive there.
      </p>

      <div className="space-y-4">
        <LocationInput
          value={pickup}
          onChange={handlePickupChange}
          onCoordinatesChange={handlePickupCoordinatesChange}
          placeholder="Pickup location"
          icon={<div className="w-2 h-2 bg-black rounded-full" />}
          type="pickup"
        />
        <LocationInput
          value={dropoff}
          onChange={handleDropoffChange}
          onCoordinatesChange={handleDropoffCoordinatesChange}
          placeholder="Dropoff location"
          icon={<div className="w-2 h-2 border-2 border-black rounded-full" />}
          type="dropoff"
        />
        <WeightInput
          value={formData.weight}
          onChange={(value) => onFormDataChange("weight", value)}
        />
        <CarrierSelection
          selectedCarrier={formData.carrier}
          onChange={(carrier) => onFormDataChange("carrier", carrier)}
        />
      </div>
      <CalculateButton
        isValid={isFormValid}
        isLoading={isLoadingData}
        pickupAddress={pickup}
        dropoffAddress={dropoff}
        hasPickupCoordinates={!!pickupCoordinates}
        hasDropoffCoordinates={!!dropoffCoordinates}
        onClick={onNext}
      />
      <FormValidationMessage
        isValid={isFormValid}
        pickupAddress={pickup}
        dropoffAddress={dropoff}
        hasPickupCoordinates={!!pickupCoordinates}
        hasDropoffCoordinates={!!dropoffCoordinates}
      />
    </motion.div>
  );
}
