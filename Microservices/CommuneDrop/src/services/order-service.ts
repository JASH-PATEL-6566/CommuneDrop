import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"
import { jwtUtils } from "../utils/jwtUtils"
import { tokenStorage } from "../utils/tokenStorage"
import { tokenService } from "./token-service"
import { API_CONFIG } from "../config/api-config"

export interface CreateOrderRequest {
  from_address: string
  to_address: string
  user_id: string
  package_weight: number
  delivery_instructions?: string
  vehicle_type: string
  distance: number
  time: number
}

// Update the OrderEstimateResponse interface to include pricing_details
export interface OrderEstimateResponse {
  _id?: string
  orderId: string
  status: string
  estimatedPrice?: {
    base: number
    distance: number
    time: number
    total: number
    currency: string
  }
  pricing_details?: {
    cost: number
    tax: number
    total_cost: number
    rider_commission: number
  }
  estimatedDelivery?: {
    time?: string
    timeWindow?: string
  }
  tracking?: {
    trackingId: string
    trackingUrl: string
  }
  createdAt?: string
  updatedAt?: string
}

export const orderService = {
  createOrder: async (request: CreateOrderRequest): Promise<ApiResponse<OrderEstimateResponse>> => {
    try {
      if (!request.user_id) {
        const token = tokenStorage.getToken()
        if (token) {
          const userId = jwtUtils.getUserId(token)
          if (userId) {
            request.user_id = userId
            console.log(`Using user ID from token: ${userId}`)
          } else {
            console.warn("Could not extract user ID from token, falling back to email")
            const userEmail = jwtUtils.getUserEmail(token)
            if (userEmail) {
              request.user_id = userEmail
            }
          }
        }
      }

      try {
        const token = await tokenService.getServiceToken("order")
        console.log("Using order service token for API request")
        if (token) {
          console.log(`Token starts with: ${token.substring(0, 15)}...`)
        }
        const url = ENDPOINTS.ORDER?.CREATE || "/order/create"
        console.log(`Making request to: ${url}`)
        console.log(`Request payload user_id: ${request.user_id}`)
        const response = await apiClient.post<ApiResponse<OrderEstimateResponse>>(url, request, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (response.success) {
          const orderData = response.data
          if (!orderData.orderId && orderData._id) {
            orderData.orderId = orderData._id
          }
          return {
            success: true,
            message: response.message || "Order created successfully",
            data: orderData,
          }
        }
        return response
      } catch (tokenError) {
        console.error("Error getting or using order service token:", tokenError)
        try {
          const healthCheckUrl = `${API_CONFIG.ORDER_SERVICE_URL}/health`
          console.log(`Attempting health check at: ${healthCheckUrl}`)
          const healthCheck = await fetch(healthCheckUrl, {
            method: "GET",
            signal: AbortSignal.timeout(3000),
          })
          console.log(`Health check status: ${healthCheck.status}`)
        } catch (healthError) {
          console.error("Health check failed:", healthError)
        }
        throw new Error("Failed to authenticate with order service. Please try again later.")
      }
    } catch (error: any) {
      console.error("Error creating order:", error)
      return {
        success: false,
        message: error.message || "Failed to create order",
        data: {} as OrderEstimateResponse,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  confirmOrder: async (orderId: string): Promise<ApiResponse<OrderEstimateResponse>> => {
    try {
      const token = await tokenService.getServiceToken("order")

      // Make the actual API call to confirm the order
      const response = await apiClient.post<ApiResponse<OrderEstimateResponse>>(
        `${API_CONFIG.ORDER_SERVICE_URL}/confirm/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to confirm order",
        data: {} as OrderEstimateResponse,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Update the processPayment function to handle empty data response
  processPayment: async (orderId: string, paymentDetails: any): Promise<ApiResponse<any>> => {
    try {
      console.log(`Processing payment for order ${orderId} with details:`, paymentDetails)

      // Get the customer ID from the auth context
      const token = await tokenService.getServiceToken("order")

      // Use the PAYMENT_INTENT endpoint directly
      const response = await apiClient.post<ApiResponse<any>>(
        ENDPOINTS.PAYMENT.PAYMENT_INTENT,
        {
          orderId: orderId,
          amount: paymentDetails.amount,
          paymentMethodId: paymentDetails.paymentMethodId,
          currency: paymentDetails.currency || "usd",
          customerId: paymentDetails.customerId || "", // Ensure customerId is never null
          // Add configuration to prevent redirect-based payment methods
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("Payment response:", response)

      // Handle the case where response.data is empty but success is true
      if (response.success && (!response.data || Object.keys(response.data).length === 0)) {
        return {
          success: true,
          message: "Payment processed successfully",
          data: {
            paymentIntentId: `pi_${Date.now()}`, // Generate a fallback ID if none provided
          },
        }
      }

      return response
    } catch (error: any) {
      console.error("Error in process payment:", error)

      return {
        success: false,
        message: error.message || "Failed to process payment",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Update the cancelOrder function to properly handle order cancellation
  cancelOrder: async (orderId: string): Promise<ApiResponse<null>> => {
    try {
      const token = await tokenService.getServiceToken("order")

      // Use the correct endpoint with the orderId
      const url = ENDPOINTS.ORDER.CANCEL.replace(":order_id", orderId)

      console.log(`Cancelling order ${orderId} using URL: ${url}`)

      const response = await apiClient.delete<ApiResponse<null>>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response
    } catch (error: any) {
      console.error("Error cancelling order:", error)
      return {
        success: false,
        message: error.message || "Failed to cancel order",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  getUserOrders: async (): Promise<ApiResponse<any[]>> => {
    try {
      // Get user ID from token
      const token = tokenStorage.getToken()
      let userId = null

      if (token) {
        userId = jwtUtils.getUserId(token)
        if (!userId) {
          const userEmail = jwtUtils.getUserEmail(token)
          if (userEmail) {
            userId = userEmail
          }
        }
      }

      if (!userId) {
        throw new Error("User ID is required")
      }

      console.log(`Fetching orders for user ID: ${userId}`)

      // Get service token for order service
      const serviceToken = await tokenService.getServiceToken("order")

      // Build the URL with the user ID
      const url = `${API_CONFIG.ORDER_SERVICE_URL}/getAllOrders/user/${encodeURIComponent(userId)}`
      console.log(`Fetching orders from: ${url}`)

      // Make the request with the service token
      const response = await apiClient.get<ApiResponse<any[]>>(url, {
        headers: {
          Authorization: `Bearer ${serviceToken}`,
        },
      })

      return response
    } catch (error: any) {
      console.error("Error fetching user orders:", error)

      return {
        success: false,
        message: error.message || "Failed to fetch user orders",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  // Keep the updateOrderStatus function as is
  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<any>> => {
    try {
      const token = await tokenService.getServiceToken("order")
      const response = await apiClient.put<ApiResponse<any>>(
        `${ENDPOINTS.ORDER.UPDATE || "/order/:order_id"}`.replace(":order_id", orderId),
        { orderId, status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update order status",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

