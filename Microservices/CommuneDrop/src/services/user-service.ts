import { apiClient } from "./api-client"
import { ENDPOINTS } from "../config/api-config"
import type { User, UserProfile, UpdateUserRequest } from "../types/auth"
import { tokenStorage, DEFAULT_PROFILE_IMAGE } from "../utils/tokenStorage"

export interface SavedLocation {
  id: number
  name: string
  address: string
  latitude?: number
  longitude?: number
  isDefault?: boolean
}

export interface PaymentMethod {
  id: number
  type: string
  last4: string
  cardholderName: string
  expiryDate: string
  isDefault: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: string[]
}

export const userService = {
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }
      const cachedProfile = tokenStorage.getUserProfile()
      if (cachedProfile && cachedProfile.email === user.email) {
        return {
          success: true,
          message: "Profile retrieved from cache",
          data: cachedProfile,
        }
      }
      try {
        const response = await apiClient.get<ApiResponse<UserProfile>>(`${ENDPOINTS.USER.DETAILS}/${user.email}`)
        if (response.success && response.data) {
          tokenStorage.setUserProfile(response.data)
        }
        return response
      } catch (apiError: any) {
        console.warn("API error, using fallback profile:", apiError)
        const fallbackProfile: UserProfile = {
          email: user.email,
          name: user.name || user.email.split("@")[0],
          profileImage: DEFAULT_PROFILE_IMAGE,
        }
        tokenStorage.setUserProfile(fallbackProfile)
        return {
          success: true,
          message: "Using fallback profile due to API error",
          data: fallbackProfile,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to fetch user profile",
        data: {} as UserProfile,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  updateProfile: async (profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }
      const updateRequest: UpdateUserRequest = {
        name: profileData.name,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        profileImage: profileData.profileImage,
      }
      const response = await apiClient.put<ApiResponse<UserProfile>>(
        `${ENDPOINTS.USER.UPDATE}/${user.email}`,
        updateRequest,
      )
      if (response.success && response.data) {
        tokenStorage.setUserProfile(response.data)
        const updatedUser: User = {
          email: user.email,
          name: response.data.name,
        }
        tokenStorage.setUser(updatedUser)
      }
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to update user profile",
        data: {} as UserProfile,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  deleteAccount: async (): Promise<ApiResponse<null>> => {
    try {
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }
      const response = await apiClient.delete<ApiResponse<null>>(`${ENDPOINTS.USER.DELETE}/${user.email}`)
      if (response.success) {
        tokenStorage.clearTokens()
      }
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to delete user account",
        data: null,
        errors: [error.message || "Unknown error occurred"],
      }
    }
  },

  uploadProfileImage: async (imageFile: File): Promise<ApiResponse<{ imageUrl: string }>> => {
    try {
      const formData = new FormData()
      formData.append("image", imageFile)
      const user = tokenStorage.getUser()
      if (!user?.email) {
        throw new Error("User email not found")
      }
      try {
        const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
          `${ENDPOINTS.USER.UPDATE}/${user.email}/image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        )
        if (response.success && response.data) {
          const currentProfile = tokenStorage.getUserProfile()
          if (currentProfile) {
            const updatedProfile = {
              ...currentProfile,
              profileImage: response.data.imageUrl,
            }
            tokenStorage.setUserProfile(updatedProfile)
          }
        }
        return response
      } catch (apiError: any) {
        console.warn("API error during image upload, using local fallback:", apiError)
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            const imageUrl = base64String
            const currentProfile = tokenStorage.getUserProfile()
            if (currentProfile) {
              const updatedProfile = {
                ...currentProfile,
                profileImage: imageUrl,
              }
              tokenStorage.setUserProfile(updatedProfile)
            }
            resolve({
              success: true,
              message: "Image uploaded successfully (local fallback)",
              data: { imageUrl },
            })
          }
          reader.readAsDataURL(imageFile)
        })
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to upload profile image",
        data: { imageUrl: "" },
        errors: [error.message || "Unknown error occurred"],
      }
    }
  }
}

