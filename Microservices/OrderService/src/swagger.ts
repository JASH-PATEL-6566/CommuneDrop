import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Order Service API",
      version: "1.0.0",
      description: "API for managing delivery orders",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.APP_PORT || 9002}`,
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
        Order: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            from_address: {
              type: "string",
              example: "123 Main St, Toronto, ON",
            },
            to_address: {
              type: "string",
              example: "456 Queen St, Toronto, ON",
            },
            user_id: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            rider_id: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            status: {
              type: "string",
              enum: [
                "ORDER PLACED",
                "ORDER CONFIRMED",
                "PAYMENT RECEIVED",
                "AWAITING PICKUP",
                "OUT FOR DELIVERY",
                "DELIVERED",
                "CANCELLED",
              ],
              example: "ORDER PLACED",
            },
            pricing_details: {
              type: "object",
              properties: {
                cost: {
                  type: "number",
                  example: 15.5,
                },
                tax: {
                  type: "number",
                  example: 2.33,
                },
                total_cost: {
                  type: "number",
                  example: 17.83,
                },
                rider_commission: {
                  type: "number",
                  example: 5.0,
                },
              },
            },
            package_weight: {
              type: "number",
              example: 2.5,
            },
            vehicle_type: {
              type: "string",
              enum: ["BIKE", "CAR", "TRUCK", "WALK"],
              example: "BIKE",
            },
            delivery_instructions: {
              type: "string",
              example: "Leave at the door",
            },
            distance: {
              type: "number",
              example: 5.2,
            },
            time: {
              type: "number",
              example: 15,
            },
            paymentId: {
              type: "string",
              example: "pay_123456789",
            },
            refundId: {
              type: "string",
              example: "ref_123456789",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CreateOrderRequest: {
          type: "object",
          required: [
            "from_address",
            "to_address",
            "user_id",
            "package_weight",
            "vehicle_type",
            "distance",
            "time",
          ],
          properties: {
            from_address: {
              type: "string",
              example: "123 Main St, Toronto, ON",
            },
            to_address: {
              type: "string",
              example: "456 Queen St, Toronto, ON",
            },
            user_id: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            package_weight: {
              type: "number",
              example: 2.5,
            },
            vehicle_type: {
              type: "string",
              enum: ["BIKE", "CAR", "TRUCK", "WALK"],
              example: "BIKE",
            },
            delivery_instructions: {
              type: "string",
              example: "Leave at the door",
            },
            distance: {
              type: "number",
              example: 5.2,
            },
            time: {
              type: "number",
              example: 15,
            },
          },
        },
        OrderPaymentRequest: {
          type: "object",
          required: ["orderId", "paymentId"],
          properties: {
            orderId: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            paymentId: {
              type: "string",
              example: "pay_123456789",
            },
          },
        },
        OrderUpdateStatusRequest: {
          type: "object",
          required: ["orderId", "status"],
          properties: {
            orderId: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            status: {
              type: "string",
              enum: [
                "ORDER PLACED",
                "ORDER CONFIRMED",
                "PAYMENT RECEIVED",
                "AWAITING PICKUP",
                "OUT FOR DELIVERY",
                "DELIVERED",
                "CANCELLED",
              ],
              example: "PAYMENT RECEIVED",
            },
          },
        },
        OrderRefundRequest: {
          type: "object",
          required: ["orderId", "refundId"],
          properties: {
            orderId: {
              type: "string",
              example: "60d21b4667d0d8992e610c85",
            },
            refundId: {
              type: "string",
              example: "ref_123456789",
            },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
              nullable: true,
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "An error occurred",
            },
            data: {
              type: "null",
              example: null,
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
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
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
export const serve = swaggerUi.serve;
export const setup = swaggerUi.setup(specs, {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
});
