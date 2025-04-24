import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  CalculateRouteMatrixCommand,
  CalculateRouteCommand,
  SearchPlaceIndexForSuggestionsCommand,
  type SearchPlaceIndexForSuggestionsCommandInput,
} from "@aws-sdk/client-location"
import { AWS_CONFIG, CACHE_TTL } from "../config"
import { logger } from "../utils/logger"
import { trackPerformance } from "../utils/performance"
import { generateCacheKey, getCachedData, setCachedData } from "../config/redis"
import type { GeocodeResponse, AddressSuggestion, RouteData, DetailedRouteData } from "../types/location.type"

const client = new LocationClient(AWS_CONFIG)

export const getAddressSuggestions = async (
  text: string,
  maxResults = 5,
  language = "en",
): Promise<AddressSuggestion[]> => {
  return trackPerformance(
    "GetAddressSuggestions",
    async () => {
      try {
        const cacheKey = generateCacheKey("suggestions", {
          text,
          maxResults,
          language,
        })
        const cachedResult = await getCachedData<AddressSuggestion[]>(cacheKey)
        if (cachedResult) {
          logger.debug(`Cache hit for address suggestions: ${text}`)
          return cachedResult
        }
        logger.debug(`Cache miss for address suggestions: ${text}`)
        logger.debug(`Fetching address suggestions for: ${text}`)
        const params: SearchPlaceIndexForSuggestionsCommandInput = {
          IndexName: process.env.AWS_PLACE_INDEX || "Place-Index-1",
          Text: text,
          MaxResults: maxResults,
          Language: language,
          FilterCountries: ["CAN"],
        }
        const command = new SearchPlaceIndexForSuggestionsCommand(params)
        const response = await client.send(command)
        const results: AddressSuggestion[] = []
        if (response.Results && response.Results.length > 0) {
          response.Results.forEach((result) => {
            if (result.Text) {
              results.push({
                text: result.Text,
                placeId: result.PlaceId || "",
                description: result.Text,
              })
            }
          })
          await setCachedData(cacheKey, results, CACHE_TTL.SUGGESTIONS)
        }

        return results
      } catch (error) {
        if (
          error.name === "ValidationException" &&
          error.message.includes("IntendedUse") &&
          error.message.includes("Storage")
        ) {
          logger.warn(
            `Place index with IntendedUse set to Storage doesn't support suggestions. Using search as fallback.`,
          )
          try {
            const command = new SearchPlaceIndexForTextCommand({
              IndexName: process.env.AWS_PLACE_INDEX || "Place-Index-1",
              Text: text,
              MaxResults: maxResults,
              FilterCountries: ["CAN"],
              FilterBBox: [-66.4, 43.3, -59.8, 47.0],
            })
            const response = await client.send(command)
            const results: AddressSuggestion[] = []
            if (response.Results && response.Results.length > 0) {
              response.Results.forEach((result) => {
                if (result.Place && result.Place.Label) {
                  results.push({
                    text: result.Place.Label,
                    placeId: result.PlaceId || "",
                    description: result.Place.Label,
                  })
                }
              })
            }
            return results
          } catch (fallbackError) {
            logger.error({ err: fallbackError }, `Fallback search also failed`)
            return []
          }
        }
        logger.error({ err: error }, `Address suggestions failed: ${error.message}`)
        return []
      }
    },
    { text, maxResults },
  )
}

export const findCoordinates = async (address: string): Promise<GeocodeResponse> => {
  return trackPerformance(
    "GetCoordinates",
    async () => {
      const cacheKey = generateCacheKey("coordinates", { address })
      const cachedResult = await getCachedData<GeocodeResponse>(cacheKey)
      if (cachedResult && typeof cachedResult.lat === "number" && typeof cachedResult.lng === "number") {
        logger.debug(`Cache hit for coordinates: ${address}`)
        return cachedResult
      }
      logger.debug(`Fetching coordinates for: ${address}`)
      const command = new SearchPlaceIndexForTextCommand({
        IndexName: process.env.AWS_PLACE_INDEX || "Place-Index-1",
        Text: address,
      })
      const response = await client.send(command)
      if (response.Results && response.Results.length > 0) {
        const { Geometry } = response.Results[0].Place
        if (!Geometry?.Point || Geometry.Point.length < 2) {
          throw new Error("Invalid geometry data received")
        }
        const coordinates: GeocodeResponse = {
          lat: Geometry.Point[1],
          lng: Geometry.Point[0],
        }
        await setCachedData(cacheKey, coordinates, CACHE_TTL.COORDINATES)
        return coordinates
      }
      throw new Error("No results found")
    },
    { address },
  )
}

export const calculateRouteMatrix = async (fromAddress: string, toAddress: string): Promise<RouteData> => {
  return trackPerformance(
    "CalculateRouteMatrix",
    async () => {
      const cacheKey = generateCacheKey("route", { fromAddress, toAddress })
      const cachedResult = await getCachedData<RouteData>(cacheKey)
      if (
        cachedResult &&
        cachedResult.from &&
        cachedResult.to &&
        typeof cachedResult.from.lat === "number" &&
        typeof cachedResult.from.lng === "number" &&
        typeof cachedResult.to.lat === "number" &&
        typeof cachedResult.to.lng === "number"
      ) {
        logger.debug(`Cache hit for route: ${fromAddress} to ${toAddress}`)
        return cachedResult
      }
      logger.debug(`Cache miss for route: ${fromAddress} to ${toAddress}`)
      logger.debug(`Calculating route matrix from ${fromAddress} to ${toAddress}`)
      const fromCoords = await findCoordinates(fromAddress)
      const toCoords = await findCoordinates(toAddress)
      const command = new CalculateRouteMatrixCommand({
        CalculatorName: process.env.AWS_ROUTE_CALCULATOR || "Route-Calculator-1",
        DeparturePositions: [[fromCoords.lng, fromCoords.lat]],
        DestinationPositions: [[toCoords.lng, toCoords.lat]],
        TravelMode: "Car",
      })
      const response = await client.send(command)
      if (response.RouteMatrix && response.RouteMatrix.length > 0 && response.RouteMatrix[0].length > 0) {
        const routeData = response.RouteMatrix[0][0]
        const result: RouteData = {
          from: { address: fromAddress, ...fromCoords },
          to: { address: toAddress, ...toCoords },
          distanceKm: routeData.Distance || "Unknown",
          durationMinutes: routeData.DurationSeconds ? (routeData.DurationSeconds / 60).toFixed(2) : "Unknown",
        }
        await setCachedData(cacheKey, result, CACHE_TTL.ROUTES)
        return result
      }

      throw new Error("No route found")
    },
    { fromAddress, toAddress },
  )
}

export const getDetailedRoute = async (fromAddress: string, toAddress: string): Promise<DetailedRouteData> => {
  return trackPerformance(
    "GetDetailedRoute",
    async () => {
      const cacheKey = generateCacheKey("detailedRoute", {
        fromAddress,
        toAddress,
      })
      const cachedResult = await getCachedData<DetailedRouteData>(cacheKey)
      if (
        cachedResult &&
        cachedResult.from &&
        cachedResult.to &&
        typeof cachedResult.from.lat === "number" &&
        typeof cachedResult.from.lng === "number" &&
        typeof cachedResult.to.lat === "number" &&
        typeof cachedResult.to.lng === "number"
      ) {
        logger.debug(`Cache hit for detailed route: ${fromAddress} to ${toAddress}`)
        return cachedResult
      }
      logger.debug(`Cache miss for detailed route: ${fromAddress} to ${toAddress}`)
      logger.debug(`Calculating detailed route from ${fromAddress} to ${toAddress}`)
      const fromCoords = await findCoordinates(fromAddress)
      const toCoords = await findCoordinates(toAddress)
      const command = new CalculateRouteCommand({
        CalculatorName: process.env.AWS_ROUTE_CALCULATOR || "Route-Calculator-1",
        DeparturePosition: [fromCoords.lng, fromCoords.lat],
        DestinationPosition: [toCoords.lng, toCoords.lat],
        TravelMode: "Car",
        IncludeLegGeometry: true,
      })
      const response = await client.send(command)
      const result: DetailedRouteData = {
        from: { address: fromAddress, ...fromCoords },
        to: { address: toAddress, ...toCoords },
        summary: {
          distance: response.Summary?.Distance || "Unknown",
          durationMinutes: response.Summary?.DurationSeconds
            ? (response.Summary.DurationSeconds / 60).toFixed(2)
            : "Unknown",
        },
        legs:
          response.Legs?.map((leg) => ({
            distance: leg.Distance,
            durationMinutes: leg.DurationSeconds ? (leg.DurationSeconds / 60).toFixed(2) : "Unknown",
            steps:
              leg.Steps?.map((step) => ({
                distance: step.Distance,
                durationSeconds: step.DurationSeconds,
                startPosition: step.StartPosition,
                endPosition: step.EndPosition,
              })) || [],
          })) || [],
        route: {
          geometry: response.Legs?.flatMap((leg) => leg.Geometry?.LineString || []) || [],
        },
      }
      await setCachedData(cacheKey, result, CACHE_TTL.ROUTES)
      return result
    },
    { fromAddress, toAddress },
  )
}

