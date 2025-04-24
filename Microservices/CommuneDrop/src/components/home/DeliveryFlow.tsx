"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchForm from "./SearchForm";
import PaymentForm from "./PaymentForm";
import DeliveryEstimate from "./DeliveryEstimate";
import ConfirmDelivery from "./ConfirmDelivery";
import DeliveryTracking from "./DeliveryTracking";
import { useOrder } from "../../context/OrderContext";
import { useLocation } from "../../context/LocationContext";

export interface DeliveryFormData {
  pickup: string;
  dropoff: string;
  pickupCoordinates?: { lat: number; lng: number };
  dropoffCoordinates?: { lat: number; lng: number };
  weight: string;
  carrier: string;
  estimatedTime: string;
  estimatedPrice: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

interface DeliveryFlowProps {
  onLocationUpdate?: (pickup: string, dropoff: string) => void;
  onCalculateRoute?: () => void;
}

export default function DeliveryFlow({
  onLocationUpdate,
  onCalculateRoute,
}: DeliveryFlowProps) {
  const {
    currentStep,
    setCurrentStep,
    pickup,
    dropoff,
    pickupCoordinates,
    dropoffCoordinates,
    weight,
    carrier,
    estimatedTime,
    estimatedPrice,
    orderId,
    orderData,
    paymentAmount,
    setOrderDetails,
  } = useOrder();

  const { setShowRoute } = useLocation();

  // Create a complete form data object for components that expect it
  const completeFormData: DeliveryFormData = {
    pickup,
    dropoff,
    pickupCoordinates,
    dropoffCoordinates,
    weight,
    carrier,
    estimatedTime: estimatedTime || "Calculating...",
    estimatedPrice: estimatedPrice
      ? estimatedPrice.toFixed(2)
      : "Calculating...",
    cardNumber: "",
    expiry: "",
    cvc: "",
  };

  // Calculate progress based on current step
  const steps = ["search", "confirm", "payment", "estimate", "tracking"];
  const progress = (steps.indexOf(currentStep) + 1) * 20;

  // Handle form data changes
  const handleFormDataChange = useCallback(
    (field: string, value: any) => {
      setOrderDetails({ [field]: value });

      if ((field === "pickup" || field === "dropoff") && !value.trim()) {
        setShowRoute(false);
      }
    },
    [setOrderDetails, setShowRoute]
  );

  // Handle navigation between steps
  const handleNavigate = useCallback(
    async (step: typeof currentStep) => {
      if (step === "search") {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setCurrentStep(step);
        return;
      }

      // When going back from payment to confirm, don't recalculate or reset state
      if (currentStep === "payment" && step === "confirm") {
        setCurrentStep(step);
        return;
      }

      if (currentStep === "search" && step === "confirm") {
        if (onCalculateRoute) {
          onCalculateRoute();
        }
        setShowRoute(true);
      }

      setCurrentStep(step);
    },
    [currentStep, onCalculateRoute, setShowRoute, setCurrentStep]
  );

  // Handle order confirmation
  const handleOrderConfirmed = useCallback(() => {
    // We don't need to do anything here as the OrderContext handles the state
    handleNavigate("payment");
  }, [handleNavigate]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(() => {
    handleNavigate("estimate");
  }, [handleNavigate]);

  // Handle tracking start
  const handleStartTracking = useCallback(() => {
    handleNavigate("tracking");
  }, [handleNavigate]);

  const transitionConfig = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      <div className="sticky top-0 z-50 bg-white">
        <div className="h-1.5 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="h-full bg-blue-600"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full transition-colors">
        <AnimatePresence mode="wait">
          {currentStep === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <SearchForm
                formData={completeFormData}
                onFormDataChange={handleFormDataChange}
                onNext={() => handleNavigate("confirm")}
                onLocationUpdate={onLocationUpdate}
              />
            </motion.div>
          )}
          {currentStep === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <ConfirmDelivery
                formData={completeFormData}
                onBack={() => handleNavigate("search")}
                onNext={handleOrderConfirmed}
              />
            </motion.div>
          )}
          {currentStep === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <PaymentForm
                onBack={() => handleNavigate("confirm")}
                onPaymentSuccess={handlePaymentSuccess}
                orderId={orderId || undefined}
                amount={paymentAmount}
              />
            </motion.div>
          )}
          {currentStep === "estimate" && (
            <motion.div
              key="estimate"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <DeliveryEstimate
                formData={completeFormData}
                estimateData={orderData}
                onBack={() => handleNavigate("payment")}
                onTrack={handleStartTracking}
              />
            </motion.div>
          )}
          {currentStep === "tracking" && orderId && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={transitionConfig}
            >
              <DeliveryTracking
                orderId={orderId}
                onBack={() => handleNavigate("estimate")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
