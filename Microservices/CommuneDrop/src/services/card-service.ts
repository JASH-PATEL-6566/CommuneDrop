import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { tokenStorage } from "../utils/tokenStorage"

export interface Card {
  id: string
  type: string
  last4: string
  cardholderName: string
  expiryDate: string
  isDefault: boolean
}

export interface CardRequest {
  customerId: string
  paymentMethodId: string
  cardholderName?: string
  last4?: string
  expiryDate?: string
  cardType?: string
  isDefault?: boolean
}

export const cardService = {
  getUserCards: async (customerId?: string): Promise<ApiResponse<Card[]>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      // If no customer ID is provided, we can't fetch cards
      if (!customerId) {
        console.log("No customer ID provided, returning empty card list")
        return {
          success: false,
          message: "No customer ID available. Please complete registration first.",
          data: [],
        }
      }

      console.log("Fetching cards for customer ID:", customerId)

      // Now get the payment methods for this customer
      const url = `${ENDPOINTS.PAYMENT.PAYMENT_METHODS}`.replace(":customerId", customerId)
      console.log("Fetching cards from URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenStorage.getToken()}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Card fetch response status:", response.status)

      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.status}`)
      }

      // Get the response as text first to debug
      const text = await response.text()
      console.log("Raw response:", text)

      // Try to parse the JSON response
      try {
        const data = JSON.parse(text)
        console.log("Parsed card data:", data)

        // Handle different response formats
        let paymentMethods: any[] = []

        if (data.success === true && Array.isArray(data.data)) {
          // Format: { success: true, data: [...] }
          paymentMethods = data.data
        } else if (Array.isArray(data)) {
          // Format: direct array
          paymentMethods = data
        } else if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
          // Format: { paymentMethods: [...] }
          paymentMethods = data.paymentMethods
        } else if (data.data && Array.isArray(data.data)) {
          // Format: { data: [...] }
          paymentMethods = data.data
        } else {
          console.error("Unexpected response format:", data)
          return {
            success: false,
            message: "Invalid response format from payment service",
            data: [],
          }
        }

        // Transform the response to match our Card interface
        const cards: Card[] = paymentMethods.map((method: any) => {
          // Extract card ID - handle different possible field names
          const id = method.id || method.payment_method_id || method.paymentMethodId || ""

          // Extract card type/brand
          const type = method.card?.brand || method.type || method.card_brand || "unknown"

          // Extract last4
          const last4 = method.card?.last4 || method.last4 || method.card_last4 || "****"

          // Extract cardholder name
          const cardholderName =
            method.billing_details?.name || method.cardholder_name || method.cardholderName || "Card Holder"

          // Extract expiry date
          let expiryDate = method.expiryDate || method.expiry_date || "**/**"
          if (method.card?.exp_month && method.card?.exp_year) {
            expiryDate = `${method.card.exp_month}/${method.card.exp_year.toString().slice(-2)}`
          }

          // Extract default status
          const isDefault = method.isDefault || method.is_default || false

          return {
            id,
            type,
            last4,
            cardholderName,
            expiryDate,
            isDefault,
          }
        })

        console.log("Transformed cards:", cards)

        return {
          success: true,
          message: "Payment methods retrieved successfully",
          data: cards,
        }
      } catch (e) {
        console.error("Failed to parse payment methods response:", e)
        return {
          success: false,
          message: "Invalid response format from payment service",
          data: [],
        }
      }
    } catch (error: any) {
      console.error("Error in getUserCards:", error)

      return {
        success: false,
        message: error.message || "Failed to fetch payment methods",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  addCard: async (cardData: any, customerId?: string): Promise<ApiResponse<Card>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      if (!customerId) {
        throw new Error("Customer ID not found. Please complete registration first.")
      }

      // Check if cardData is properly defined
      if (!cardData) {
        throw new Error("Card data is missing")
      }

      // Ensure we have a valid payment method ID
      if (!cardData.id && !cardData.paymentMethodId) {
        throw new Error("Payment method ID is missing")
      }

      // Prepare the request data with fallbacks for all properties
      const requestData: CardRequest = {
        customerId: customerId,
        paymentMethodId: cardData.id || cardData.paymentMethodId || "",
        cardholderName: cardData.cardholderName || "Card Holder",
        last4: cardData.last4 || "****",
        expiryDate: cardData.expiryDate || "**/**",
        cardType: cardData.type || "unknown",
        isDefault: cardData.isDefault || false,
      }

      // Send the request to add the payment method with details
      const response = await fetch(`${ENDPOINTS.PAYMENT.PAYMENT_METHOD_DETAILS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`Failed to add payment method: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to add payment method")
      }

      // Return the card data in our expected format with fallbacks
      const card: Card = {
        id: data.paymentMethod?.id || requestData.paymentMethodId,
        type: data.paymentMethod?.card?.brand || cardData.type || "unknown",
        last4: data.paymentMethod?.card?.last4 || cardData.last4 || "****",
        cardholderName: data.paymentMethod?.billing_details?.name || cardData.cardholderName || "Card Holder",
        expiryDate:
          cardData.expiryDate ||
          `${data.paymentMethod?.card?.exp_month || "**"}/${data.paymentMethod?.card?.exp_year?.toString().slice(-2) || "**"}`,
        isDefault: data.paymentMethod?.isDefault || cardData.isDefault || false,
      }

      return {
        success: true,
        message: "Payment method added successfully",
        data: card,
      }
    } catch (error: any) {
      console.error("Error in addCard:", error)

      return {
        success: false,
        message: error.message || "Failed to add payment method",
        data: {} as Card,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  deleteCard: async (cardId: string, customerId?: string): Promise<ApiResponse<null>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      if (!customerId) {
        throw new Error("Customer ID not found. Please complete registration first.")
      }

      // Send the request to delete the payment method
      const response = await fetch(`${ENDPOINTS.PAYMENT.PAYMENT_METHOD}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify({
          customerId: customerId,
          paymentMethodId: cardId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete payment method: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to delete payment method")
      }

      return {
        success: true,
        message: "Payment method deleted successfully",
        data: null,
      }
    } catch (error: any) {
      console.error("Error in deleteCard:", error)

      return {
        success: false,
        message: error.message || "Failed to delete payment method",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  setDefaultCard: async (cardId: string, customerId?: string): Promise<ApiResponse<Card>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }

      if (!customerId) {
        throw new Error("Customer ID not found. Please complete registration first.")
      }

      // Make an API call to set this card as default
      const response = await fetch(`${ENDPOINTS.PAYMENT.PAYMENT_METHOD}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify({
          customerId: customerId,
          paymentMethodId: cardId,
          isDefault: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to set default payment method: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to set default payment method")
      }

      return {
        success: true,
        message: "Default payment method set successfully",
        data: {
          id: cardId,
          type: data.paymentMethod?.card?.brand || "unknown",
          last4: data.paymentMethod?.card?.last4 || "****",
          cardholderName: data.paymentMethod?.billing_details?.name || "Card Holder",
          expiryDate: `${data.paymentMethod?.card?.exp_month || "**"}/${data.paymentMethod?.card?.exp_year?.toString().slice(-2) || "**"}`,
          isDefault: true,
        },
      }
    } catch (error: any) {
      console.error("Error in setDefaultCard:", error)

      return {
        success: false,
        message: error.message || "Failed to set default payment method",
        data: {} as Card,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

