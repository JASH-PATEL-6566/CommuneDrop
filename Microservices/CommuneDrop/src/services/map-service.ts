import { tokenService } from "./token-service"
import { ENDPOINTS, API_CONFIG } from "../config/api-config"
import { tokenStorage } from "../utils/tokenStorage"

export interface GeocodingResult {
  address: string
  latitude: number
  longitude: number
  formattedAddress?: string
  placeId?: string
}

export interface Route {
  path: Array<{ lat: number; lng: number }>
  distance: {
    text: string
    value: number
  }
  duration: {
    text: string
    value: number
  }
}

export interface AutocompleteResult {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
  text?: string
}

interface DetectedLocation {
  city: string
  province: string
  country: string
}

const defaultLocation: DetectedLocation = {
  city: API_CONFIG.DEFAULT_CITY,
  province: API_CONFIG.DEFAULT_PROVINCE,
  country: API_CONFIG.DEFAULT_COUNTRY,
}

export const mapService = {
  getAddressSuggestions: async (text: string): Promise<AutocompleteResult[]> => {
    if (!text.trim()) return []
    try {
      const location = defaultLocation
      const maxResults = API_CONFIG.MAX_RESULTS
      const language = "en"
      let searchText = text
      searchText = `${searchText}, ${location.city}, ${location.province}, ${location.country}`
      const url = `${ENDPOINTS.MAPS.AUTOCOMPLETE}?text=${encodeURIComponent(searchText)}&maxResults=${maxResults}&language=${encodeURIComponent(language)}`
      let token
      try {
        token = await tokenService.getServiceToken("location")
      } catch (error) {
        console.warn("Failed to get service token, falling back to user token")
        token = tokenStorage.getToken()
      }
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: {
          "Accept-Language": language,
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error(`Autocomplete failed with status: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        return data.map((item: Record<string, any>) => ({
          placeId: item.placeId || "",
          description: item.description || item.text || "",
          mainText: item.mainText || item.text || item.description || "",
          secondaryText: item.secondaryText || "",
          text: item.text || item.description || "",
        }))
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        return data.suggestions.map((item: Record<string, any>) => ({
          placeId: item.placeId || "",
          description: item.description || item.text || "",
          mainText: item.mainText || item.text || item.description || "",
          secondaryText: item.secondaryText || "",
          text: item.text || item.description || "",
        }))
      } else if (data.predictions && Array.isArray(data.predictions)) {
        return data.predictions.map((item: Record<string, any>) => ({
          placeId: item.place_id || "",
          description: item.description || "",
          mainText: item.structured_formatting?.main_text || item.description || "",
          secondaryText: item.structured_formatting?.secondary_text || "",
          text: item.description || "",
        }))
      } else {
        return []
      }
    } catch (error) {
      return []
    }
  },

  geocodeAddress: async (address: string): Promise<GeocodingResult> => {
    if (!address || address.trim().length < 3) {
      return {
        address,
        latitude: 0,
        longitude: 0,
      }
    }
    try {
      const isCoordinatePair = address.match(
        /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
      )
      let addressWithContext = address
      if (!isCoordinatePair) {
        const location = defaultLocation
        addressWithContext = `${addressWithContext}, ${location.city}, ${location.province}`
      }
      const payload = {
        address: addressWithContext,
        country: API_CONFIG.DEFAULT_COUNTRY,
      }
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      let token
      try {
        token = await tokenService.getServiceToken("location")
      } catch (error) {
        console.warn("Failed to get service token, falling back to user token")
        token = tokenStorage.getToken()
      }
      try {
        const response = await fetch(ENDPOINTS.MAPS.GEOCODE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (!response.ok) {
          throw new Error(`Geocoding failed with status: ${response.status}`)
        }
        const data = await response.json()
        if (!data || (data.latitude === undefined && data.lat === undefined)) {
          throw new Error("Invalid geocoding response format")
        }
        const latitude = data.latitude !== undefined ? data.latitude : data.lat
        const longitude = data.longitude !== undefined ? data.longitude : data.lng
        const result = {
          address,
          latitude: latitude || 0,
          longitude: longitude || 0,
          formattedAddress: data.formattedAddress || data.formatted_address || address,
          placeId: data.placeId || data.place_id,
        }
        return result
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Geocoding request timed out")
        }
        throw new Error(
          `Network error during geocoding: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        )
      }
    } catch (error: any) {
      return {
        address,
        latitude: 0,
        longitude: 0,
      }
    }
  },

  getDistanceMatrix: async (
    fromAddress: string,
    toAddress: string,
  ): Promise<{
    distance: { text: string; value: number }
    duration: { text: string; value: number }
  }> => {
    try {
      let token
      try {
        token = await tokenService.getServiceToken("location")
      } catch (error) {
        console.warn("Failed to get service token, falling back to user token")
        token = tokenStorage.getToken()
      }
      const response = await fetch(ENDPOINTS.MAPS.DISTANCE_MATRIX, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromAddress, toAddress }),
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) {
        throw new Error(`Distance matrix failed with status: ${response.status}`)
      }
      const data = await response.json()
      return {
        distance: {
          text: data.distance?.text || "0 km",
          value: data.distance?.value || 0,
        },
        duration: {
          text: data.duration?.text || "0 mins",
          value: data.duration?.value || 0,
        },
      }
    } catch (error) {
      return {
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
      }
    }
  },

  getDirections: async (
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    waypoints?: Array<{ lat: number; lng: number } | string>,
  ): Promise<any> => {
    const fromAddress = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
    const toAddress = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`
    try {
      let token
      try {
        token = await tokenService.getServiceToken("location")
      } catch (error) {
        console.warn("Failed to get service token, falling back to user token")
        token = tokenStorage.getToken()
      }
      const response = await fetch(ENDPOINTS.MAPS.DIRECTIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          waypoints: waypoints?.map((wp) => (typeof wp === "string" ? wp : `${wp.lat},${wp.lng}`)),
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) {
        throw new Error(`Directions failed with status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      return {
        path: [],
        distance: { text: "Unknown", value: 0 },
        duration: { text: "Unknown", value: 0 },
      }
    }
  },
}

