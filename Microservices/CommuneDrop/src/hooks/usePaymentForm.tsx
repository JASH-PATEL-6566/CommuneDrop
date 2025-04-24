"use client";

import { useState, useCallback } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { cardService } from "../services/card-service";
import { paymentService } from "../services/payment-service";

interface UsePaymentFormProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  amount: number; // in cents
  orderId?: string;
}

export function usePaymentForm({
  onPaymentSuccess,
  amount,
  orderId = "temp_order",
}: UsePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [useNewCard, setUseNewCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);

  // Handle payment submission
  const handlePayment = useCallback(async () => {
    if (!stripe || (!elements && !selectedCardId)) return;

    setLoading(true);
    setError("");
    setPaymentStatus("processing");

    try {
      // If using a saved card
      if (selectedCardId) {
        // Process payment with the selected card
        const paymentResponse = await paymentService.processPayment({
          orderId,
          paymentMethodId: selectedCardId,
          amount: amount / 100, // Convert from cents to dollars for the API
        });

        if (paymentResponse.success) {
          setPaymentStatus("success");
          setTimeout(() => {
            onPaymentSuccess(
              paymentResponse.paymentIntentId || `pi_${Date.now()}`
            );
          }, 2000);
        } else {
          throw new Error(paymentResponse.message || "Payment failed");
        }
      } else {
        // Using new card with Stripe Elements
        if (!elements) {
          throw new Error("Stripe Elements not initialized");
        }

        // Create a payment intent
        const paymentIntentResponse = await paymentService.createPaymentIntent(
          amount,
          "usd"
        );

        if (
          !paymentIntentResponse.success ||
          !paymentIntentResponse.data.clientSecret
        ) {
          throw new Error("Failed to create payment intent");
        }

        const clientSecret = paymentIntentResponse.data.clientSecret;

        // Confirm the payment with the card element
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
          setup_future_usage: saveNewCard ? "off_session" : undefined,
        });

        // If payment is successful and user wants to save the card
        if (!result.error && saveNewCard) {
          try {
            // In a real implementation, we would get card details from the payment method
            if (result.paymentIntent && result.paymentIntent.payment_method) {
              // Extract card details from the payment method ID
              const mockCard = {
                cardNumber: "************1234", // We don't actually store the full number
                cardholderName: "Card Holder", // This would come from a form in a real app
                expiryDate: "12/25",
                cvv: "***", // We don't store the CVV
                isDefault: false,
              };

              // Save card to our backend
              await cardService.addCard(mockCard);
            }
          } catch (cardError) {
            console.error("Error saving card:", cardError);
            // We don't fail the payment if card saving fails
          }
        }

        if (result.error) {
          throw new Error(result.error.message || "Payment failed");
        } else if (result.paymentIntent) {
          setPaymentStatus("success");
          setTimeout(() => {
            onPaymentSuccess(result.paymentIntent!.id);
          }, 2000);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setPaymentStatus("error");
    } finally {
      setLoading(false);
    }
  }, [
    stripe,
    elements,
    selectedCardId,
    onPaymentSuccess,
    orderId,
    amount,
    saveNewCard,
  ]);

  // Add a retry handler function
  const handleRetry = useCallback(() => {
    setPaymentStatus("idle");
    setError("");
    setLoading(false);
    // Reset the card input
    if (elements) {
      const cardElement = elements.getElement(CardElement);
      if (cardElement) {
        cardElement.clear();
      }
    }
  }, [elements]);

  return {
    loading,
    error,
    paymentStatus,
    useNewCard,
    selectedCardId,
    saveNewCard,
    setSaveNewCard,
    setUseNewCard,
    setSelectedCardId,
    handlePayment,
    handleRetry,
    savedCards,
    setSavedCards,
  };
}
