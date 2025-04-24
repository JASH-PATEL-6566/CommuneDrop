import express from "express"
import {
  getAddressSuggestions,
  getCoordinates,
  calculateRoute,
  getDetailedRoute,
} from "../controllers/location.controller"
import { clearAllCache, clearCacheByPrefix, getCacheStats } from "../controllers/cache.controller"
import { authorize } from "../middleware/auth.middleware"

const router = express.Router()

/**
 * @swagger
 * /location:
 *   get:
 *     summary: Service information
 *     description: Returns basic information about the location service
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: Service information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: location-service
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "location-service",
    version: "1.0.0",
    endpoints: ["/autocomplete", "/geocode", "/matrix", "/route", "/health"],
  })
})

/**
 * @swagger
 * /location/autocomplete:
 *   get:
 *     summary: Get address suggestions
 *     description: Returns address suggestions based on input text
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: text
 *         required: true
 *         schema:
 *           type: string
 *         description: Text to search for
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum number of results to return
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code for results
 *     responses:
 *       200:
 *         description: List of address suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AddressSuggestion'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/autocomplete", authorize(["location.read"]), getAddressSuggestions)

/**
 * @swagger
 * /location/geocode:
 *   post:
 *     summary: Convert address to coordinates
 *     description: Returns latitude and longitude for a given address
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeocodeRequest'
 *     responses:
 *       200:
 *         description: Coordinates for the address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeocodeResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/geocode", authorize(["location.read"]), getCoordinates)

/**
 * @swagger
 * /location/matrix:
 *   post:
 *     summary: Calculate route matrix
 *     description: Returns distance and duration between two addresses
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RouteRequest'
 *     responses:
 *       200:
 *         description: Route information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RouteResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/matrix", authorize(["location.read"]), calculateRoute)

/**
 * @swagger
 * /location/route:
 *   post:
 *     summary: Get detailed route
 *     description: Returns detailed route with waypoints between two addresses
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RouteRequest'
 *     responses:
 *       200:
 *         description: Detailed route information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetailedRouteResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/route", authorize(["location.read"]), getDetailedRoute)

/**
 * @swagger
 * /location/cache:
 *   delete:
 *     summary: Clear all cache
 *     description: Clears all cached data (admin only)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/cache", authorize(["location.admin"]), clearAllCache)

/**
 * @swagger
 * /location/cache/{prefix}:
 *   delete:
 *     summary: Clear cache by prefix
 *     description: Clears cached data with a specific prefix (admin only)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache prefix (e.g., coordinates, route, detailedRoute, suggestions)
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/cache/:prefix", authorize(["location.admin"]), clearCacheByPrefix)

/**
 * @swagger
 * /location/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Returns statistics about the cache (admin only)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalKeys:
 *                   type: integer
 *                 typeCounts:
 *                   type: object
 *                 redisInfo:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/cache/stats", authorize(["location.admin"]), getCacheStats)

/**
 * @swagger
 * /location/health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: location-service
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "location-service" })
})

export default router

