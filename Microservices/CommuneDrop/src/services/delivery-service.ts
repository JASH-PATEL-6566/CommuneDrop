import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { ApiResponse } from "./user-service"

export interface DeliveryEstimateRequest {
  pickup: {
    address: string
    latitude?: number
    longitude?: number
  }
  dropoff: {
    address: string
    latitude?: number
    longitude?: number
  }
  packageDetails?: {
    weight?: number
    dimensions?: {
      length?: number
      width?: number
      height?: number
    }
    description?: string
  }
  carrierType?: "car" | "truck" | "bike" | "walk"
}

export interface DeliveryEstimateResponse {
  estimatedPrice: {
    base: number
    distance: number
    time: number
    total: number
    currency: string
  }
  estimatedTime: {
    minutes: number
    text: string
  }
  distance: {
    meters: number
    text: string
  }
  route: {
    points: Array<{
      lat: number
      lng: number
    }>
  }
  availableCarriers: Array<{
    type: string
    name: string
    estimatedTime: string
    price: number
  }>
}

export interface DeliveryRequest extends DeliveryEstimateRequest {
  paymentMethodId: number
  instructions?: string
  scheduledTime?: string
}

export interface DeliveryResponse {
  id: string
  status: string
  tracking: {
    trackingId: string
    trackingUrl: string
  }
  estimatedDelivery: {
    time: string
    timeWindow: string
  }
  driver?: {
    id: string
    name: string
    phone?: string
    rating: number
    vehicle?: {
      type: string
      color: string
      model: string
      licensePlate: string
    }
  }
}

export interface DeliveryHistoryItem {
  id: string
  date: string
  from: string
  to: string
  status: string
  price: string
  carrier: string
  details?: {
    pickup: {
      address: string
      latitude: number
      longitude: number
      time: string
    }
    dropoff: {
      address: string
      latitude: number
      longitude: number
      time: string
    }
    driver?: {
      name: string
      rating: number
      trips: number
    }
    tracking: {
      trackingId: string
      trackingUrl: string
    }
  }
}

export const deliveryService = {
  getEstimate: async (request: DeliveryEstimateRequest): Promise<ApiResponse<DeliveryEstimateResponse>> => {
    try {
      return await apiClient.post<ApiResponse<DeliveryEstimateResponse>>(ENDPOINTS.DELIVERY.ESTIMATE, request)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to get delivery estimate",
        data: {} as DeliveryEstimateResponse,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  createDelivery: async (request: DeliveryRequest): Promise<ApiResponse<DeliveryResponse>> => {
    try {
      return await apiClient.post<ApiResponse<DeliveryResponse>>(ENDPOINTS.DELIVERY.CREATE, request)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to create delivery",
        data: {} as DeliveryResponse,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  getHistory: async (): Promise<ApiResponse<DeliveryHistoryItem[]>> => {
    try {
      try {
        return await apiClient.get<ApiResponse<DeliveryHistoryItem[]>>(ENDPOINTS.ORDER.USER_ORDERS)
      } catch (apiError: any) {
        if (apiError.status === 404) {
          console.warn("Delivery history endpoint not found, returning empty array")
          return {
            success: true,
            message: "No delivery history found",
            data: [],
          }
        }
        throw apiError
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to get delivery history",
        data: [],
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  getDeliveryById: async (id: string): Promise<ApiResponse<DeliveryHistoryItem>> => {
    try {
      return await apiClient.get<ApiResponse<DeliveryHistoryItem>>(`${ENDPOINTS.ORDER.USER_ORDERS}/${id}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to get delivery details",
        data: {} as DeliveryHistoryItem,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  trackDelivery: async (
    trackingId: string,
  ): Promise<
    ApiResponse<{
      status: string
      location: {
        latitude: number
        longitude: number
        address?: string
      }
      estimatedTimeRemaining: {
        minutes: number
        text: string
      }
      deliveryProgress: number
      updates: Array<{
        time: string
        status: string
        description: string
      }>
    }>
  > => {
    try {
      return await apiClient.get<
        ApiResponse<{
          status: string
          location: {
            latitude: number
            longitude: number
            address?: string
          }
          estimatedTimeRemaining: {
            minutes: number
            text: string
          }
          deliveryProgress: number
          updates: Array<{
            time: string
            status: string
            description: string
          }>
        }>
      >(`${ENDPOINTS.DELIVERY.TRACK}/${trackingId}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to track delivery",
        data: {
          status: "unknown",
          location: {
            latitude: 0,
            longitude: 0,
          },
          estimatedTimeRemaining: {
            minutes: 0,
            text: "Unknown",
          },
          deliveryProgress: 0,
          updates: [],
        },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

