import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { tokenStorage } from "../utils/tokenStorage"

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  status: string
}

export interface StripeTokenResponse {
  id: string
  object: string
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

// Update the PaymentRequest interface to include customerId
export interface PaymentRequest {
  orderId: string
  paymentMethodId: string
  amount: number
  currency?: string
  description?: string
  customerId?: string
}

export interface PaymentResponse {
  success: boolean
  paymentIntentId?: string
  status?: string
  message?: string
}

export interface CustomerResponse {
  success: boolean
  customerId: string
  message?: string
}

export const paymentService = {
  // Create a new customer (only called during registration)
  createCustomer: async (name: string, email: string): Promise<CustomerResponse> => {
    try {
      console.log("Creating new customer with name:", name, "and email:", email)

      const response = await fetch(`${ENDPOINTS.PAYMENT.CUSTOMER}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify({ name, email }),
      })

      // First check if it's a health check response
      const text = await response.text()
      if (text.includes("I am healthy")) {
        console.log("Received health check response instead of customer data")

        return {
          success: false,
          customerId: "",
          message: "Payment service is in health check mode and not ready to process requests",
        }
      }

      // Try to parse the JSON response
      try {
        const data = JSON.parse(text)
        if (response.ok && data.customerId) {
          return {
            success: true,
            customerId: data.customerId,
          }
        }

        return {
          success: false,
          customerId: "",
          message: data.message || "Failed to create customer",
        }
      } catch (e) {
        console.error("Failed to parse customer response:", text)

        return {
          success: false,
          customerId: "",
          message: "Unable to create customer. Please check your Stripe configuration.",
        }
      }
    } catch (error) {
      console.error("Error creating customer:", error)

      return {
        success: false,
        customerId: "",
        message: error instanceof Error ? error.message : "Failed to create customer",
      }
    }
  },

  // Get customer by email (used after login)
  getCustomerByEmail: async (email: string): Promise<CustomerResponse> => {
    try {
      console.log("Fetching customer by email:", email)

      // Use the specific endpoint for getting a customer by email
      const response = await fetch(`${ENDPOINTS.PAYMENT.CUSTOMER}/${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
      })

      console.log("Customer fetch response status:", response.status)

      // Check if it's a health check response
      const text = await response.text()
      console.log("Customer fetch response text:", text.substring(0, 100) + "...")

      if (text.includes("I am healthy")) {
        console.log("Received health check response instead of customer data")

        return {
          success: false,
          customerId: "",
          message: "Payment service is in health check mode and not ready to process requests",
        }
      }

      // Try to parse the JSON response
      try {
        const data = JSON.parse(text)
        console.log("Parsed customer data:", data)

        // If customer found, return it
        if (response.ok && data.customerId) {
          return {
            success: true,
            customerId: data.customerId,
          }
        }

        // Check if the response has data.data.customerId structure
        if (response.ok && data.data && data.data.customerId) {
          return {
            success: true,
            customerId: data.data.customerId,
          }
        }

        // If customer not found, don't create one - just return not found
        if (response.status === 404) {
          return {
            success: false,
            customerId: "",
            message: "Customer not found. Please complete registration first.",
          }
        }

        return {
          success: false,
          customerId: "",
          message: data.message || "Customer not found",
        }
      } catch (e) {
        console.error("Failed to parse customer response:", text)

        return {
          success: false,
          customerId: "",
          message: "Unable to parse customer data. Please check your Stripe configuration.",
        }
      }
    } catch (error) {
      console.error("Error fetching customer by email:", error)

      return {
        success: false,
        customerId: "",
        message: error instanceof Error ? error.message : "Failed to fetch customer",
      }
    }
  },

  /**
   * Create a payment intent with Stripe
   * This should be called from your backend, but we're simulating it here
   */
  createPaymentIntent: async (
    amount: number,
    currency = "usd",
    customerId?: string,
    paymentMethodId?: string,
    orderId?: string,
  ): Promise<ApiResponse<PaymentIntent>> => {
    try {
      // Make an actual call to your backend to create a payment intent
      const response = await fetch(`${ENDPOINTS.PAYMENT.PAYMENT_INTENT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          customerId,
          paymentMethodId,
          orderId,
          // Add configuration to prevent redirect-based payment methods
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error creating payment intent:", error)

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create payment intent",
        data: {} as PaymentIntent,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      }
    }
  },

  // Update the processPayment function to handle the customerId parameter correctly
  processPayment: async (paymentRequest: PaymentRequest): Promise<PaymentResponse> => {
    try {
      console.log("Processing payment with request:", paymentRequest)

      // Call the PAYMENT_INTENT endpoint with the required parameters
      const response = await fetch(`${ENDPOINTS.PAYMENT.PAYMENT_INTENT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify({
          amount: paymentRequest.amount,
          customerId: paymentRequest.customerId || "",
          paymentMethodId: paymentRequest.paymentMethodId,
          orderId: paymentRequest.orderId,
          currency: paymentRequest.currency || "usd",
          // Add configuration to prevent redirect-based payment methods
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          success: true,
          paymentIntentId: data.paymentIntentId || data.data?.paymentIntentId,
          status: "succeeded",
        }
      } else {
        throw new Error(data.message || "Payment processing failed")
      }
    } catch (error) {
      console.error("Error processing payment:", error)

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process payment",
      }
    }
  },

  /**
   * Process a refund
   */
  refundPayment: async (paymentIntentId: string, amount?: number, reason?: string): Promise<PaymentResponse> => {
    try {
      const response = await fetch(`${ENDPOINTS.PAYMENT.REFUND}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStorage.getToken()}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          amount,
          reason,
        }),
      })

      const data = await response.json()
      return {
        success: response.ok,
        message: !response.ok ? data.message || "Failed to process refund" : undefined,
      }
    } catch (error) {
      console.error("Error processing refund:", error)

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process refund",
      }
    }
  },
}

