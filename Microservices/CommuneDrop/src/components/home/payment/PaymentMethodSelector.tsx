"use client";

import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import type { Card } from "../../../services/card-service";
import { useAuth } from "../../../context/AuthContext";
// Add the necessary imports at the top of the file
import { ENDPOINTS } from "../../../config/api-config";
import { tokenStorage } from "../../../utils/tokenStorage";

const CARD_TYPES = {
  visa: {
    name: "Visa",
    icon: "VISA",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  mastercard: {
    name: "Mastercard",
    icon: "MC",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  amex: {
    name: "American Express",
    icon: "AMEX",
    color: "text-green-700",
    bg: "bg-green-50",
  },
  discover: {
    name: "Discover",
    icon: "DISC",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
};

interface PaymentMethodSelectorProps {
  savedCards: any[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  isLoading?: boolean;
}

// Update the PaymentMethodSelector component to match the screenshot styling

export default function PaymentMethodSelector({
  savedCards: initialSavedCards,
  selectedCardId,
  onSelectCard,
  isLoading = false,
}: PaymentMethodSelectorProps) {
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  // Fix the initial loading state to be false if we have cards
  const [loading, setLoading] = useState(
    initialSavedCards.length > 0 ? false : true
  );
  const [error, setError] = useState<string | null>(null);
  const { user, customerId, fetchCustomerId } = useAuth();

  // Update the useEffect hook to directly call the PAYMENT.PAYMENT_METHODS endpoint
  useEffect(() => {
    // Make sure initialSavedCards is an array before checking its length
    const cards = Array.isArray(initialSavedCards) ? initialSavedCards : [];

    // If we already have cards from props, use them and stop loading
    if (cards.length > 0) {
      // Filter to only show the default card
      const defaultCard = cards.find((card) => card.isDefault);
      setSavedCards(defaultCard ? [defaultCard] : [cards[0]]);
      setLoading(false);

      // Select the default card if none is selected
      if (!selectedCardId && cards.length > 0) {
        const cardToSelect = defaultCard || cards[0];
        onSelectCard(cardToSelect.id);
      }
      return;
    }

    // Only fetch cards if we don't have any and we're not already loading
    if (cards.length === 0 && !loading && user?.email) {
      const fetchCards = async () => {
        setLoading(true);
        setError(null);
        try {
          const customerIdValue = await fetchCustomerId();

          if (!customerIdValue) {
            setError(
              "No customer ID available. Please complete registration first."
            );
            setLoading(false);
            return;
          }

          // Directly call the PAYMENT.PAYMENT_METHODS endpoint
          const url = `${ENDPOINTS.PAYMENT.PAYMENT_METHODS}`.replace(
            ":customerId",
            customerIdValue
          );

          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${tokenStorage.getToken()}`,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch payment methods: ${response.status}`
            );
          }

          const responseData = await response.json();

          // Check if the response has the expected format with a data array
          if (responseData && Array.isArray(responseData.data)) {
            // Transform the response to match our Card interface based on the actual response format
            const fetchedCards: Card[] = responseData.data.map(
              (method: any) => ({
                id: method.payment_method_id,
                type: method.card_brand || "unknown",
                last4: method.card_last4 || "****",
                cardholderName: method.cardholder_name || "Card Holder",
                expiryDate: method.expiry_date || "**/**",
                isDefault: method.is_default || false,
              })
            );

            // Filter to only show the default card
            const defaultCard = fetchedCards.find((card) => card.isDefault);
            setSavedCards(
              defaultCard
                ? [defaultCard]
                : fetchedCards.length > 0
                ? [fetchedCards[0]]
                : []
            );

            // Select a default card if none is selected
            if (fetchedCards.length > 0 && !selectedCardId) {
              const cardToSelect = defaultCard || fetchedCards[0];
              onSelectCard(cardToSelect.id);
            }
          } else {
            console.error("Unexpected response format:", responseData);
            setError("Invalid response format from payment service");
          }
        } catch (err) {
          setError(
            "An unexpected error occurred while loading payment methods"
          );
          console.error("Error fetching cards:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchCards();
    }
  }, [
    initialSavedCards,
    selectedCardId,
    onSelectCard,
    loading,
    user?.email,
    fetchCustomerId,
  ]);

  // Update the return statement to match the screenshot styling
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {loading || isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loader className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        savedCards.map((card) => (
          <div
            key={card.id}
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => onSelectCard(card.id)}
          >
            <div className="flex items-center gap-3">
              <div className="text-blue-600 font-bold">VISA</div>
              <div>
                <div className="font-medium">
                  Visa •••• {card.last4 || "4242"}
                </div>
                <div className="text-sm text-gray-500">
                  Expires {card.expiryDate}
                </div>
              </div>
            </div>
            <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
              {selectedCardId === card.id && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
