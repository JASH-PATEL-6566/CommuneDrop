import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { SERVER_CONFIG } from "./config"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Location Service API",
      version: "1.0.0",
      description: "API for geocoding, route calculation, and location services",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${SERVER_CONFIG.PORT}`,
        description: "Development server",
      },
      {
        url: "https://api.example.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        GeocodeRequest: {
          type: "object",
          required: ["address"],
          properties: {
            address: {
              type: "string",
              example: "123 Main St, Toronto, ON",
            },
          },
        },
        GeocodeResponse: {
          type: "object",
          properties: {
            lat: {
              type: "number",
              example: 43.6532,
            },
            lng: {
              type: "number",
              example: -79.3832,
            },
          },
        },
        RouteRequest: {
          type: "object",
          required: ["fromAddress", "toAddress"],
          properties: {
            fromAddress: {
              type: "string",
              example: "123 Main St, Toronto, ON",
            },
            toAddress: {
              type: "string",
              example: "456 Queen St, Toronto, ON",
            },
          },
        },
        RouteResponse: {
          type: "object",
          properties: {
            from: {
              type: "object",
              properties: {
                address: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            to: {
              type: "object",
              properties: {
                address: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            distanceKm: {
              oneOf: [{ type: "number" }, { type: "string" }],
              example: 5.2,
            },
            durationMinutes: {
              type: "string",
              example: "15.5",
            },
          },
        },
        DetailedRouteResponse: {
          type: "object",
          properties: {
            from: {
              type: "object",
              properties: {
                address: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            to: {
              type: "object",
              properties: {
                address: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            summary: {
              type: "object",
              properties: {
                distance: {
                  oneOf: [{ type: "number" }, { type: "string" }],
                },
                durationMinutes: { type: "string" },
              },
            },
            legs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  distance: { type: "number" },
                  durationMinutes: { type: "string" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        distance: { type: "number" },
                        durationSeconds: { type: "number" },
                        startPosition: {
                          type: "array",
                          items: { type: "number" },
                        },
                        endPosition: {
                          type: "array",
                          items: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
            route: {
              type: "object",
              properties: {
                geometry: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: "number" },
                  },
                },
              },
            },
          },
        },
        AddressSuggestion: {
          type: "object",
          properties: {
            text: { type: "string" },
            placeId: { type: "string" },
            description: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
}

export const specs = swaggerJsdoc(options)
export const serve = swaggerUi.serve
export const setup = swaggerUi.setup(specs, {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
})

