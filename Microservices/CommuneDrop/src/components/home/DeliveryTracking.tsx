"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Truck, CheckCircle, Package } from "lucide-react";
import { useTracking } from "../../context/TrackingContext";
import { useNotifications } from "../notifications/NotificationProvider";

interface DeliveryTrackingProps {
  orderId: string;
  onBack: () => void;
}

export default function DeliveryTracking({
  orderId,
  onBack,
}: DeliveryTrackingProps) {
  const {
    isTracking,
    driverLocation,
    orderStatus,
    startTracking,
    stopTracking,
  } = useTracking();
  const { sendStructuredNotification } = useNotifications();
  const [currentStep, setCurrentStep] = useState(0);

  // Define the delivery steps
  const deliverySteps = [
    {
      id: "CONFIRMED",
      label: "Order Confirmed",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      id: "DRIVER_ASSIGNED",
      label: "Driver Assigned",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: "DRIVER_PICKUP",
      label: "Driver at Pickup",
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: "IN_TRANSIT",
      label: "In Transit",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: "ARRIVING",
      label: "Arriving Soon",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: "DELIVERED",
      label: "Delivered",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];

  // Start tracking when component mounts
  useEffect(() => {
    startTracking(orderId);

    return () => {
      stopTracking();
    };
  }, [orderId, startTracking, stopTracking]);

  // Update current step based on order status
  useEffect(() => {
    if (orderStatus) {
      const stepIndex = deliverySteps.findIndex(
        (step) => step.id === orderStatus.status
      );
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [orderStatus]);

  // For demo purposes - send test notifications with standardized format
  const sendTestDriverLocation = () => {
    sendStructuredNotification("info", "DriverLiveLocation", {
      orderId: orderId,
      data: {
        message: "Driver location updated",
        location: {
          lat: 44.6488 + (Math.random() * 0.01 - 0.005),
          lng: -63.5752 + (Math.random() * 0.01 - 0.005),
          heading: Math.random() * 360,
          speed: Math.random() * 50,
        },
      },
    });
  };

  const sendTestStatusUpdate = (status: string) => {
    sendStructuredNotification("success", "OrderStatusUpdated", {
      orderId: orderId,
      data: {
        status: status,
        estimatedArrival: "10 minutes",
        message: `Your order is now ${status}`,
      },
    });
  };

  return (
    <motion.div
      key="tracking"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-3 h-full flex flex-col"
    >
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-full mr-3"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Track Delivery</h1>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <h2 className="font-medium text-gray-900 mb-2">
          Order #{orderId.substring(0, 8)}
        </h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Status:</span>
          <span className="font-medium text-primary">
            {orderStatus?.status || "Tracking..."}
          </span>
        </div>
        {orderStatus?.estimatedArrival && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Estimated arrival:</span>
            <span className="font-medium">{orderStatus.estimatedArrival}</span>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <h2 className="font-medium text-gray-900 mb-3">Delivery Progress</h2>
        <div className="relative">
          {/* Vertical line connecting steps */}
          <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-gray-200 z-0"></div>

          {/* Steps */}
          {deliverySteps.map((step, index) => (
            <div key={step.id} className="flex items-start mb-4 relative z-10">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index <= currentStep
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step.icon}
              </div>
              <div className="ml-3">
                <p
                  className={`font-medium ${
                    index <= currentStep ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                {index === currentStep && orderStatus?.message && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {orderStatus.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo controls - only for testing */}
      <div className="mt-auto bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Demo Controls
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={sendTestDriverLocation}
            className="bg-blue-100 text-blue-700 p-2 rounded text-xs"
          >
            Update Driver Location
          </button>
          {deliverySteps.map((step) => (
            <button
              key={step.id}
              onClick={() => sendTestStatusUpdate(step.id)}
              className="bg-green-100 text-green-700 p-2 rounded text-xs"
            >
              Set {step.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
