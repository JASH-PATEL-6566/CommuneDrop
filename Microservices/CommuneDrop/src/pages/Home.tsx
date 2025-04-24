"use client";

import Navbar from "../components/Navbar";
import DeliveryFlow from "../components/home/DeliveryFlow";
import Map from "../components/home/Map";
import { useLocation } from "../context/LocationContext";

export default function Home() {
  const {
    pickup,
    dropoff,
    mapPositions,
    mapCenter,
    hasEnteredLocations,
    isLoadingMap,
    setPickup,
    setDropoff,
    calculateRoute,
  } = useLocation();

  // Handle location updates from DeliveryFlow component
  const handleLocationUpdate = (newPickup: string, newDropoff: string) => {
    console.log("Location update received:", { newPickup, newDropoff });

    // Only update if values have changed
    if (pickup !== newPickup) {
      setPickup(newPickup);
    }

    if (dropoff !== newDropoff) {
      setDropoff(newDropoff);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50 overflow-hidden"
      style={{ maxHeight: "100vh" }}
    >
      <Navbar />
      <div className="flex flex-1 p-6 gap-6 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-full md:w-[400px] overflow-hidden">
          <DeliveryFlow
            onLocationUpdate={handleLocationUpdate}
            onCalculateRoute={calculateRoute}
          />
        </div>
        <div
          className="hidden md:block flex-1 rounded-lg overflow-hidden"
          style={{ height: "calc(100vh - 4rem - 48px)" }}
        >
          <Map
            positions={mapPositions}
            center={mapCenter}
            drawRoute={mapPositions.length > 1}
            hasEnteredLocations={hasEnteredLocations}
            isLoading={isLoadingMap}
          />
        </div>
      </div>
    </div>
  );
}
