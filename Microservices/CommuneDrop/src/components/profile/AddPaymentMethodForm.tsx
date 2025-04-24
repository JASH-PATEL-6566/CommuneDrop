"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { motion } from "framer-motion";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/payment-service";

// Update the Stripe initialization to properly handle API key issues
// At the top of the file, add a check for the API key

// Ensure we're loading Stripe outside the component with proper error handling
const stripePromise = (() => {
  const apiKey = import.meta.env.VITE_PUBLIC_STRIPE_API_KEY || "";

  // Check if the key is a secret key
  if (apiKey.startsWith("sk_")) {
    console.error(
      "ERROR: You are using a Stripe secret key in client-side code. This is a security risk!"
    );
    console.error("Please use a publishable key (starts with pk_) instead.");
    return null;
  }

  if (!apiKey) {
    console.error(
      "Missing Stripe API key. Please check your environment variables."
    );
    return null;
  }

  return loadStripe(apiKey);
})();

interface AddPaymentMethodFormProps {
  onAddCard: (card: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function AddPaymentMethodForm({
  onAddCard,
  onCancel,
  isSubmitting = false,
}: AddPaymentMethodFormProps) {
  // Initialize Stripe
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [newCardData, setNewCardData] = useState({
    cardholderName: "",
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardError, setCardError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Get or create customer ID when component mounts
  useEffect(() => {
    const getCustomerId = async () => {
      if (!user?.email) return;

      try {
        const response = await paymentService.getCustomerByEmail(user.email);

        if (response.success) {
          setCustomerId(response.customerId);
        } else {
          setCardError(response.message || "Failed to get customer ID");
        }
      } catch (error) {
        setCardError(
          error instanceof Error ? error.message : "Failed to get customer ID"
        );
      }
    };

    getCustomerId();
  }, [user]);

  // Reset card error when form changes
  useEffect(() => {
    setCardError(null);
  }, [newCardData]);

  const handleCardInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setNewCardData({
        ...newCardData,
        [name]: checked,
      });
    } else {
      setNewCardData({
        ...newCardData,
        [name]: value,
      });

      // Clear error when user types
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: "",
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate cardholder name
    if (!newCardData.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCard = async () => {
    if (!validateForm()) {
      return;
    }

    if (!stripe || !elements || !customerId) {
      setCardError(
        !customerId
          ? "Customer ID not available. Please try again later."
          : "Stripe hasn't been properly initialized"
      );
      return;
    }

    try {
      // Create PaymentMethod using the CardElement
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setCardError("Card information is missing");
        return;
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: newCardData.cardholderName || "Card Holder",
        },
      });

      if (error) {
        setCardError(error.message || "Failed to process card information");
        return;
      }

      if (!paymentMethod) {
        setCardError("Failed to create payment method");
        return;
      }

      // Format the card data with the Stripe payment method
      const newCard = {
        id: paymentMethod.id,
        paymentMethodId: paymentMethod.id, // Add this as a fallback
        customerId: customerId,
        cardholderName: newCardData.cardholderName || "Card Holder",
        last4: paymentMethod.card?.last4 || "****",
        expiryDate:
          paymentMethod.card?.exp_month && paymentMethod.card?.exp_year
            ? `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year
                .toString()
                .slice(-2)}`
            : "**/**",
        type: paymentMethod.card?.brand || "unknown",
        isDefault: newCardData.isDefault,
      };

      console.log("Adding new card:", newCard);

      // Pass the card data to the parent component
      onAddCard(newCard);
    } catch (err) {
      console.error("Error creating payment method:", err);
      setCardError("An unexpected error occurred while processing your card");
    }
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.07,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      className="border rounded-lg p-6 mb-6"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 className="text-lg font-medium mb-4" variants={itemVariants}>
        Add Payment Method
      </motion.h3>
      <div className="space-y-4">
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Card Information
          </label>
          <div className="p-3 border rounded border-gray-300 bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#333",
                    "::placeholder": { color: "#aab7c4" },
                  },
                  invalid: {
                    color: "#e53e3e",
                  },
                },
              }}
            />
          </div>
          {cardError && (
            <p className="text-red-500 text-xs mt-1">{cardError}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            name="cardholderName"
            value={newCardData.cardholderName}
            onChange={handleCardInputChange}
            placeholder="John Doe"
            className={`w-full p-2 border ${
              errors.cardholderName ? "border-red-500" : "border-gray-300"
            } rounded`}
            disabled={isSubmitting}
          />
          {errors.cardholderName && (
            <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
          )}
        </motion.div>

        <motion.div className="flex items-center mt-2" variants={itemVariants}>
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={newCardData.isDefault}
            onChange={handleCardInputChange}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label
            htmlFor="isDefault"
            className="ml-2 block text-sm text-gray-700"
          >
            Set as default payment method
          </label>
        </motion.div>

        <motion.div
          className="flex justify-end gap-3 pt-4"
          variants={itemVariants}
        >
          <motion.button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
            type="button"
            whileHover={{ scale: 1.03, backgroundColor: "rgba(0, 0, 0, 0.02)" }}
            whileTap={{ scale: 0.97 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleAddCard}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
            type="button"
            whileHover={{ scale: 1.03, backgroundColor: "#333" }}
            whileTap={{ scale: 0.97 }}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Adding...
              </>
            ) : (
              "Add Card"
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
