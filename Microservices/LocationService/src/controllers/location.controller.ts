import type { Request, Response } from "express"
import { logger } from "../utils/logger"
import {
  findCoordinates,
  calculateRouteMatrix,
  getDetailedRoute as getDetailedRouteService,
  getAddressSuggestions as getAddressSuggestionsService,
} from "../service/location.service"

export const getAddressSuggestions = async (req: Request, res: Response) => {
    try {
        const { text, maxResults, language } = req.query
        if (!text) {
        return res.status(400).json({ error: "Search text is required" })
        }
        const limit = maxResults ? Number.parseInt(maxResults as string, 10) : 5
        if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: "maxResults must be a positive number" })
        }
        const suggestions = await getAddressSuggestionsService(text as string, limit, language as string)
        res.json(suggestions)
    } catch (error) {
        logger.error({ err: error }, "Autocomplete error")
        if (error.message && error.message.includes("IntendedUse") && error.message.includes("Storage")) {
        res.json([])
        } else {
        res.status(500).json({ error: error.message })
        }
    }
}

export const getCoordinates = async (req: Request, res: Response) => {
    try {
        const { address } = req.body
        if (!address) {
        return res.status(400).json({ error: "Address is required" })
        }
        const coordinates = await findCoordinates(address)
        res.json(coordinates)
    } catch (error) {
        logger.error({ err: error }, "Geocoding error")
        res.status(500).json({ error: error.message })
    }
}

export const calculateRoute = async (req: Request, res: Response) => {
    try {
        const { fromAddress, toAddress } = req.body
        if (!fromAddress || !toAddress) {
        return res.status(400).json({ error: "Both 'fromAddress' and 'toAddress' are required" })
        }
        const routeData = await calculateRouteMatrix(fromAddress, toAddress)
        res.json(routeData)
    } catch (error) {
        logger.error({ err: error }, "Route matrix error")
        res.status(500).json({ error: error.message })
    }
}

export const getDetailedRoute = async (req: Request, res: Response) => {
    try {
        const { fromAddress, toAddress } = req.body
        if (!fromAddress || !toAddress) {
        return res.status(400).json({ error: "Both 'fromAddress' and 'toAddress' are required" })
        }
        const detailedRoute = await getDetailedRouteService(fromAddress, toAddress)
        res.json(detailedRoute)
    } catch (error) {
        logger.error({ err: error }, "Detailed route error")
        res.status(500).json({ error: error.message })
    }
}

