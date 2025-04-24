import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import axios from "axios"
import { API_CONFIG } from "../config/api-config"
import { tokenStorage } from "../utils/tokenStorage"
import { jwtUtils } from "../utils/jwtUtils"

const defaultConfig: AxiosRequestConfig = {
  baseURL: API_CONFIG.AUTH_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
}

class ApiClient {
  private instance: AxiosInstance
  private isRefreshing = false
  private failedQueue: any[] = []

  constructor(config: AxiosRequestConfig = {}) {
    this.instance = axios.create({
      ...defaultConfig,
      ...config,
    })
    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.headers && config.headers.Authorization) {
          console.log(`Using provided Authorization header for ${config.method?.toUpperCase()} ${config.url}`)
        } else {
          const token = tokenStorage.getToken()
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
            console.log(`Using user token for ${config.method?.toUpperCase()} ${config.url}`)
          }
        }
        if (import.meta.env.DEV) {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: {
              ...config.headers,
              Authorization: config.headers?.Authorization
                ? `${config.headers.Authorization.toString().substring(0, 15)}...`
                : "none",
            },
            data: config.data,
          })
        }
        return config
      },
      (error) => Promise.reject(error),
    )
    this.instance.interceptors.response.use(
      (response) => {
        if (import.meta.env.DEV) {
          console.log(
            `API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
            {
              data: response.data,
            },
          )
        }
        return response
      },
      async (error: AxiosError) => {
        if (import.meta.env.DEV) {
          console.error(
            `API Error: ${error.response?.status || "Network Error"} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            {
              message: error.message,
              response: error.response?.data,
            },
          )
        }
        const originalRequest = error.config
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest.headers._retry &&
          !this.isRefreshing
        ) {
          originalRequest.headers._retry = true
          this.isRefreshing = true
          try {
            const refreshToken = tokenStorage.getRefreshToken()

            if (!refreshToken) {
              return Promise.reject(error)
            }
            const token = tokenStorage.getToken()
            if (token && jwtUtils.isTokenExpired(token)) {
              const response = await this.refreshToken(refreshToken)
              if (response.success) {
                const { token: newToken, refreshToken: newRefreshToken } = response.data
                tokenStorage.setTokens(newToken, newRefreshToken)
                this.instance.defaults.headers.common.Authorization = `Bearer ${newToken}`
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`
                }
                this.processQueue(null, newToken)
                return this.instance(originalRequest)
              }
            }
          } catch (refreshError) {
            const error = refreshError instanceof Error ? refreshError : new Error(String(refreshError))
            this.processQueue(error, null)
            tokenStorage.clearTokens()
            window.location.href = "/login"
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }
        return Promise.reject(error)
      },
    )
  }

  private processQueue(error: Error | null, token: string | null): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve(token)
      }
    })
    this.failedQueue = []
  }

  private async refreshToken(refreshToken: string) {
    try {
      const response = await axios.post<any>(
        `${API_CONFIG.AUTH_BASE_URL}/auth/refresh-token`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      )
      return response.data
    } catch (error) {
      throw error
    }
  }

  private async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const maxRetries = 2
    let retries = 0

    while (retries <= maxRetries) {
      try {
        const response: AxiosResponse<T> = await this.instance.request(config)
        return response.data
      } catch (error: unknown) {
        // If we've reached max retries, throw the error
        if (retries === maxRetries) {
          if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data
            throw {
              status: error.response.status,
              data: errorData,
              message: errorData.message || "An error occurred with the API request",
            }
          } else if (axios.isAxiosError(error) && error.request) {
            throw {
              status: 0,
              message: "No response received from server. Please check your connection.",
            }
          } else {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
            throw {
              message: errorMessage,
            }
          }
        }

        // If it's a 429 (Too Many Requests) or 5xx error, retry
        if (
          axios.isAxiosError(error) &&
          error.response &&
          (error.response.status === 429 || (error.response.status >= 500 && error.response.status < 600))
        ) {
          retries++
          console.log(`Retrying request (${retries}/${maxRetries}) after error:`, error.message)
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
          continue
        }

        // For other errors, don't retry
        throw error
      }
    }

    // This should never be reached due to the while loop condition
    throw new Error("Unexpected error in request retry logic")
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "GET", url })
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "POST", url, data })
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "PUT", url, data })
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "DELETE", url })
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "PATCH", url, data })
  }
}

export const apiClient = new ApiClient()
export const createApiClient = (config?: AxiosRequestConfig) => new ApiClient(config)

