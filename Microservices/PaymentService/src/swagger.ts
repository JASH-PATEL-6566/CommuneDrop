import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import type { Express } from "express"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Payment Service API",
      version: "1.0.0",
      description: "API documentation for the Payment Service",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "/payment",
        description: "Payment Service API",
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/models/*.ts"],
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app: Express) => {
  app.use(
    "/payment/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Payment Service API Documentation",
    }),
  )

  // Serve the OpenAPI spec as JSON
  app.get("/payment/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.send(specs)
  })
}

