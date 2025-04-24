import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth"

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials)
      return response
    } catch (error: any) {
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Login failed. Please try again.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, userData)
      return response
    } catch (error: any) {
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Registration failed. Please try again.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken })
      return response
    } catch (error: any) {
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Token refresh failed.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  verifyEmail: async (email: string, code: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code })
      return response
    } catch (error: any) {
      return {
        statusCode: error.status || 500,
        success: false,
        message: error.message || "Email verification failed.",
        data: { token: "", refreshToken: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },
}

export const api = {
  auth: authService,
}

