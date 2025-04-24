"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";
import { useOrder } from "../../context/OrderContext";
import PaymentMethodSelector from "./payment/PaymentMethodSelector";
import OrderSummary from "./payment/OrderSummary";
import PaymentButton from "./payment/PaymentButton";
import SuccessConfetti from "./payment/SuccessConfetti";
import { cardService, type Card } from "../../services/card-service";
import { Loader } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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

interface PaymentFormProps {
  onBack: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  orderId?: string;
  amount?: number | null; // in cents
}

export default function PaymentWithStripe(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}

// Update the header and layout to match the confirm delivery page
function StripePaymentForm({
  onBack,
  onPaymentSuccess,
  orderId,
}: PaymentFormProps) {
  const {
    paymentAmount,
    estimatedPrice,
    paymentStatus,
    error: orderError,
    processPayment,
    orderData,
    resetOrder,
  } = useOrder();

  const stripe = useStripe();
  const elements = useElements();
  const { user, customerId, fetchCustomerId } = useAuth();

  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get customer ID and fetch saved cards
  useEffect(() => {
    let isMounted = true;
    const initializePayment = async () => {
      if (!user?.email) return;

      setIsLoadingCards(true);
      setCardError(null);

      try {
        // Ensure we have a customer ID from context
        const customerIdValue = customerId || (await fetchCustomerId());

        if (!customerIdValue) {
          if (isMounted) {
            setCardError(
              "No Stripe customer account found. Please contact support to set up your payment profile."
            );
            setUseNewCard(true); // Force using a new card
          }
          setIsLoadingCards(false);
          return;
        }

        // Then fetch saved cards
        const cardsResponse = await cardService.getUserCards(customerIdValue);
        if (isMounted) {
          if (cardsResponse.success) {
            setSavedCards(cardsResponse.data);
            if (cardsResponse.data.length > 0) {
              const defaultCard = cardsResponse.data.find(
                (card) => card.isDefault
              );
              if (defaultCard) {
                setSelectedCardId(defaultCard.id);
              } else {
                setSelectedCardId(cardsResponse.data[0].id);
              }
              setUseNewCard(false);
            } else {
              setUseNewCard(true);
              if (!cardError) {
                setCardError(
                  "No payment methods available. Please add a new card."
                );
              }
            }
          } else {
            setCardError(
              cardsResponse.message || "Failed to load payment methods"
            );
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error initializing payment:", error);
          setCardError("Failed to load payment methods. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCards(false);
        }
      }
    };

    initializePayment();

    return () => {
      isMounted = false;
    };
  }, [user, customerId, fetchCustomerId]);

  const handlePayment = async () => {
    if (!stripe || !elements || !orderId) {
      setError("Payment processing is not available. Please try again later.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (useNewCard) {
        // Handle new card payment with Stripe Elements
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Card information is missing");
        }

        // Create a PaymentMethod with the card details
        const { error: createError, paymentMethod } =
          await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
          });

        if (createError) {
          throw new Error(createError.message);
        }

        if (!paymentMethod) {
          throw new Error("Failed to create payment method");
        }

        // If we have a customer ID, attach this payment method
        const customerIdValue = customerId || (await fetchCustomerId());
        if (customerIdValue) {
          try {
            // Ensure we have all the required data with fallbacks
            const cardData = {
              customerId: customerIdValue,
              id: paymentMethod.id,
              paymentMethodId: paymentMethod.id,
              cardholderName: user?.name || "Card Holder",
              last4: paymentMethod.card?.last4 || "****",
              cardType: paymentMethod.card?.brand || "unknown",
              type: paymentMethod.card?.brand || "unknown",
              expiryDate:
                paymentMethod.card?.exp_month && paymentMethod.card?.exp_year
                  ? `${
                      paymentMethod.card.exp_month
                    }/${paymentMethod.card.exp_year.toString().slice(-2)}`
                  : "**/**",
              isDefault: savedCards.length === 0,
            };

            console.log("Saving card data:", cardData);

            await cardService.addCard(cardData, customerIdValue);
          } catch (err) {
            console.warn("Failed to save card, continuing with payment", err);
            // Don't throw here, we still want to try the payment
          }
        }

        // Process payment with the newly created payment method ID and customer ID
        const success = await processPayment(
          paymentMethod.id,
          customerIdValue || ""
        );
        if (success) {
          setTimeout(() => {
            onPaymentSuccess(paymentMethod.id);
          }, 2000);
        }
      } else if (selectedCardId) {
        // Process payment with selected saved card and customer ID
        const customerIdValue = customerId || (await fetchCustomerId());
        const success = await processPayment(
          selectedCardId,
          customerIdValue || ""
        );
        if (success) {
          setTimeout(() => {
            onPaymentSuccess(selectedCardId);
          }, 2000);
        }
      } else {
        // If no card is selected but we have saved cards, use the first one (which should be the default)
        if (savedCards.length > 0) {
          const customerIdValue = customerId || (await fetchCustomerId());
          const defaultCardId = savedCards[0].id;
          const success = await processPayment(
            defaultCardId,
            customerIdValue || ""
          );
          if (success) {
            setTimeout(() => {
              onPaymentSuccess(defaultCardId);
            }, 2000);
          }
        } else {
          throw new Error("Please select a payment method or add a new card.");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Payment processing failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Reset the payment status in the order context
    resetOrder();
  };

  const pricingDetails = orderData?.pricing_details;
  const displayAmount = paymentAmount
    ? (paymentAmount / 100).toFixed(2)
    : estimatedPrice
    ? estimatedPrice.toFixed(2)
    : pricingDetails?.total_cost?.toFixed(2) || "65.22";
  const totalValue = Number.parseFloat(displayAmount);
  const deliveryFee =
    pricingDetails?.cost?.toFixed(2) || (totalValue * 0.8125).toFixed(2);
  const serviceFee =
    pricingDetails?.tax?.toFixed(2) || (totalValue * 0.1875).toFixed(2);
  const handleBack = () => {
    onBack();
  };

  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-white"
    >
      <AnimatePresence>
        {paymentStatus === "success" && <SuccessConfetti />}
      </AnimatePresence>
      <div className="flex items-center p-4">
        <button
          onClick={handleBack}
          className="mr-4"
          disabled={
            loading ||
            paymentStatus === "processing" ||
            paymentStatus === "success"
          }
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold">Payment</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center">
          <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-sm text-gray-700">Secure payment processing</p>
        </div>
        {orderId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Order ID:</span> {orderId}
            </p>
          </div>
        )}
        {(error || cardError || orderError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">Error</p>
              <p className="text-xs text-red-600">
                {error || cardError || orderError}
              </p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold mb-3">Payment Method</h3>

          {isLoadingCards ? (
            <div className="py-4 flex justify-center items-center">
              <Loader className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="radio"
                    id="useSavedCard"
                    checked={!useNewCard}
                    onChange={() => setUseNewCard(false)}
                    disabled={savedCards.length === 0 || isLoadingCards}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label
                    htmlFor="useSavedCard"
                    className="text-sm font-medium text-gray-700"
                  >
                    Use saved payment method
                  </label>
                </div>

                {!useNewCard && savedCards.length > 0 && (
                  <PaymentMethodSelector
                    savedCards={savedCards}
                    selectedCardId={selectedCardId}
                    onSelectCard={setSelectedCardId}
                    isLoading={false}
                  />
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="radio"
                    id="useNewCard"
                    checked={useNewCard}
                    onChange={() => setUseNewCard(true)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label
                    htmlFor="useNewCard"
                    className="text-sm font-medium text-gray-700"
                  >
                    Use a new card
                  </label>
                </div>

                {useNewCard && (
                  <div className="p-3 border border-gray-300 rounded-lg">
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
                )}
              </div>
            </>
          )}
        </div>
        <OrderSummary
          deliveryFee={deliveryFee}
          serviceFee={serviceFee}
          total={displayAmount}
          pricingDetails={orderData?.pricing_details}
        />
        <AnimatePresence>
          {paymentStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center text-sm text-green-600"
            >
              Payment successful! Redirecting to confirmation...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 border-t">
        <PaymentButton
          paymentStatus={paymentStatus}
          isDisabled={
            loading ||
            isLoadingCards ||
            paymentStatus === "processing" ||
            paymentStatus === "success" ||
            (!selectedCardId && !useNewCard)
          }
          amount={displayAmount}
          onClick={paymentStatus === "error" ? handleRetry : handlePayment}
          orderId={orderId || undefined}
        />
      </div>
    </motion.div>
  );
}
