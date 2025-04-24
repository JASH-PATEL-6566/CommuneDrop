import type { User, UserProfile } from "../types/auth"

// Update the DEFAULT_PROFILE_IMAGE to use a data URI instead of a network request
export const DEFAULT_PROFILE_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNEMUQxRDEiLz48cGF0aCBkPSJNNzUgNjVDODUuNDkzIDY1IDk0IDU2LjQ5MyA5NCA0NkM5NCAzNS41MDcgODUuNDkzIDI3IDc1IDI3QzY0LjUwNyAyNyA1NiAzNS51MDcgNTYgNDZDNTYgNTYuNDkzIDY0LjUwNyA2NSA3NSA2NVoiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNNzUgMTIzQzk1Ljk4NyAxMjMgMTEzIDEwNS45ODcgMTEzIDg1SDg1Qzc1IDg1IDY1IDc1IDY1IDY1SDM3QzU3IDg1IDU3IDEyMyA3NSAxMjNaIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+"
export const DEFAULT_AVATAR_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiNEMUQxRDEiLz48cGF0aCBkPSJNMTYgMTRDMTguMjA5MSAxNCAxOS45OTk5IDEyLjIwOTEgMTkuOTk5OSAxMEMxOS45OTk5IDcuNzkwODYgMTguMjA5MSA2IDE2IDZDMTMuNzkwOCA2IDEyIDcuNzkwODYgMTIgMTBDMTIgMTIuMjA5MSAxMy43OTA4IDE0IDE2IDE0WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNiAyNkMyMC40MTgzIDI2IDI0IDIyLjQxODMgMjQgMTghMThDMTYgMTggMTQgMTYgMTQgMTRIOEMxMiAxOCAxMiAyNiAxNiAyNloiIGZpbGw9IiM5Q0EzQUYiLz48L3N2Zz4="

const TOKEN_KEY = "communedrop_token"
const REFRESH_TOKEN_KEY = "communedrop_refresh_token"
const USER_KEY = "communedrop_user"
const USER_PROFILE_KEY = "communedrop_user_profile"

export const tokenStorage = {
  setTokens: (token: string, refreshToken: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } catch (error) {
      console.error("Error storing tokens:", error)
    }
  },

  setUser: (user: User): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error("Error storing user data:", error)
    }
  },

  setUserProfile: (profile: UserProfile): void => {
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
    } catch (error) {
      console.error("Error storing user profile data:", error)
    }
  },

  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error("Error retrieving token:", error)
      return null
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error("Error retrieving refresh token:", error)
      return null
    }
  },

  getUser: (): User | null => {
    try {
      const userData = localStorage.getItem(USER_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error retrieving user data:", error)
      return null
    }
  },

  getUserProfile: (): UserProfile | null => {
    try {
      const profileData = localStorage.getItem(USER_PROFILE_KEY)
      return profileData ? JSON.parse(profileData) : null
    } catch (error) {
      console.error("Error retrieving user profile data:", error)
      return null
    }
  },

  clearTokens: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(USER_PROFILE_KEY)
    } catch (error) {
      console.error("Error clearing tokens:", error)
    }
  },

  isAuthenticated: (): boolean => {
    try {
      return !!localStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error("Error checking authentication status:", error)
      return false
    }
  },
}

