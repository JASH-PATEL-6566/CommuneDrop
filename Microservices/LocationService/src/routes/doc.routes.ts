import express from "express"

const router = express.Router()

router.get("/", (req, res) => {
  res.json({
    service: "Location Service API",
    version: "1.0.0",
    authentication: {
      type: "JWT",
      header: "Authorization: Bearer YOUR_JWT_TOKEN",
      scopes: {
        "location.read": "Required for read operations like geocoding and route calculation",
        "location.write": "Required for write operations (currently not used)",
        "location.admin": "Required for administrative operations like cache management",
      },
    },
    endpoints: [
      {
        path: "/api/location/autocomplete",
        method: "GET",
        auth: "JWT with location.read scope",
        description: "Get address suggestions for autocomplete",
        query: {
          text: "string (required)",
          maxResults: "number (optional, default: 5)",
          language: "string (optional, default: en)",
        },
      },
      {
        path: "/api/location/geocode",
        method: "POST",
        auth: "JWT with location.read scope",
        description: "Convert address to coordinates",
        body: { address: "string" },
      },
      {
        path: "/api/location/matrix",
        method: "POST",
        auth: "JWT with location.read scope",
        description: "Calculate distance and duration between two addresses",
        body: { fromAddress: "string", toAddress: "string" },
      },
      {
        path: "/api/location/route",
        method: "POST",
        auth: "JWT with location.read scope",
        description: "Get detailed route with waypoints between two addresses",
        body: { fromAddress: "string", toAddress: "string" },
      },
      {
        path: "/api/location/cache",
        method: "DELETE",
        auth: "JWT with location.admin scope",
        description: "Clear all cache (admin only)",
      },
      {
        path: "/api/location/cache/:prefix",
        method: "DELETE",
        auth: "JWT with location.admin scope",
        description: "Clear cache entries with a specific prefix (admin only)",
        params: {
          prefix: "string (e.g., coordinates, route, detailedRoute, suggestions)",
        },
      },
      {
        path: "/api/location/cache/stats",
        method: "GET",
        auth: "JWT with location.admin scope",
        description: "Get cache statistics",
      },
      {
        path: "/api/location/health",
        method: "GET",
        auth: "No authentication required",
        description: "Health check endpoint",
      },
    ],
  })
})

export default router

