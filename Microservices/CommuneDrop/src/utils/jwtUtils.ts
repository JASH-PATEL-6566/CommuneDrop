interface JwtPayload {
  exp?: number
  [key: string]: any
}

export const jwtUtils = {
  parseToken: (token: string): JwtPayload | null => {
    try {
      const base64Url = token.split(".")[1]
      if (!base64Url) return null

      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Error parsing JWT token:", error)
      return null
    }
  },

  getUserEmail: (token: string): string | null => {
    try {
      const decoded = jwtUtils.parseToken(token)
      if (!decoded) return null
      return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || null
    } catch (error) {
      console.error("Error getting user email from token:", error)
      return null
    }
  },

  getUserId: (token: string): string | null => {
    try {
      const decoded = jwtUtils.parseToken(token)
      if (!decoded) return null

      // Try multiple possible locations for the user ID
      if (decoded.sub) {
        return decoded.sub
      }

      // Check for ID in standard JWT claims
      if (decoded.id) {
        return decoded.id
      }

      // Check for ID in .NET Identity claims
      if (decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]) {
        return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
      }

      // If no ID found, return null
      return null
    } catch (error) {
      console.error("Error getting user ID from token:", error)
      return null
    }
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const decoded = jwtUtils.parseToken(token)
      if (!decoded || !decoded.exp) return true

      const currentTime = Date.now() / 1000
      return decoded.exp < currentTime
    } catch (error) {
      console.error("Error checking token expiration:", error)
      return true
    }
  },
}

