# OrderService - Order Management and Payment Processing API

![Node.js](https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000.svg?style=for-the-badge&logo=Express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20.svg?style=for-the-badge&logo=Apache-Kafka&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED.svg?style=for-the-badge&logo=Docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5.svg?style=for-the-badge&logo=Kubernetes&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D.svg?style=for-the-badge&logo=Swagger&logoColor=black)
![JWT](https://img.shields.io/badge/JSON%20Web%20Tokens-000000.svg?style=for-the-badge&logo=JSON-Web-Tokens&logoColor=white)
![Pino](https://img.shields.io/badge/Pino-00A86B.svg?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTEyIDZjLTMuMzEgMC02IDIuNjktNiA2czIuNjkgNiA2IDYgNi0yLjY5IDYtNi0yLjY5LTYtNi02eiIvPjwvc3ZnPg==)

## Overview

OrderService is a microservice for managing delivery orders in a delivery platform. It handles order creation, payment processing, status management, and communicates with other services through Kafka messaging.

**Key Features:**

- **Order Creation**: Create delivery orders with detailed pricing and route information
- **Payment Processing**: Integration with payment service
- **Order Status Management**: Track order status throughout the delivery lifecycle
- **Pricing Calculation**: Calculate delivery costs based on distance and vehicle type
- **Event-Driven Architecture**: Publish order events to Kafka for notifications
- **Secure API**: JWT-based authentication with role-based access control
- **Kubernetes Deployment**: Containerized deployment with Kubernetes
- **API Documentation**: Swagger/OpenAPI documentation

---

## Architecture

### Microservice Integration

OrderService integrates with other microservices:

| Service            | Interaction                                |
| ------------------ | ------------------------------------------ |
| **PaymentService** | Processes payments and refunds for orders  |
| **AuthService**    | Validates JWT tokens for secure API access |
| **KafkaService**   | Messaging system for order status updates  |

---

## Technologies

- **Backend**: Node.js with Express
- **Database**: MongoDB for order storage
- **Messaging**: Kafka for event-driven communication
- **Authentication**: JWT-based auth with role-based access
- **Documentation**: Swagger/OpenAPI for API documentation
- **Logging**: Pino for structured logging
- **Containerization**: Docker
- **Orchestration**: Kubernetes

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- Kubernetes (for production)
- MongoDB instance
- Kafka cluster
- Payment service endpoint

### Quick Start

1. **Clone the repository**

   ```shellscript
   git clone https://github.com/yourusername/OrderService.git
   cd OrderService
   ```

2. **Install dependencies**

   ```shellscript
   npm install
   ```

3. **Set up environment variables**

   ```plaintext
   PORT=9002
   DB_URL=mongodb+srv://username:password@cluster.mongodb.net/database
   PAYMENT_SERVICE=http://payment-service/payment
   CLIENT_ID=order-service
   GROUP_ID=order-service-group
   BROKER_1=kafka:9092
   ```

4. **Start the development server**

   ```shellscript
   npm run dev
   ```

5. **Access the API documentation**

   Open your browser and navigate to `http://localhost:9002/api-docs`

---

## Project Structure

```plaintext
├── src/                    # Source code
│   ├── controllers/        # API controllers
│   │   └── order.controller.ts
│   ├── db/                 # Database configuration
│   │   ├── index.ts        # MongoDB connection
│   │   └── Models/         # Mongoose models
│   │       └── Order.ts    # Order schema
│   ├── middlewares/        # Express middleware
│   │   ├── auth.middleware.ts
│   │   └── validateReq.middleware.ts
│   ├── repository/         # Data access layer
│   │   └── order.repository.ts
│   ├── routes/             # API routes
│   │   └── order.routes.ts
│   ├── service/            # Business logic
│   │   ├── broker.service.ts
│   │   ├── notification.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   └── valuation.service.ts
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── broker/         # Kafka utilities
│   │   ├── error/          # Error handling
│   │   ├── logger/         # Logging utilities
│   │   └── response/       # Response formatting
│   ├── express-app.ts      # Express application setup
│   ├── server.ts           # Main server entry point
│   └── swagger.ts          # Swagger documentation
├── k8s/                    # Kubernetes configurations
│   ├── OrderService-configmap.yaml
│   ├── OrderService-secret.yaml
│   └── OrderService-deployment.yaml
├── docker-compose.yml      # Docker compose for local development
```

---

## Key Features

### Order Management

- Create delivery orders with addresses, package details, and pricing
- Track order status: ORDER PLACED, ORDER CONFIRMED, PAYMENT RECEIVED, AWAITING PICKUP, OUT FOR DELIVERY, DELIVERED, CANCELLED
- Support for different vehicle types: BIKE, CAR, TRUCK, WALK
- Order history for users and riders
- Order cancellation with refund processing

### Payment Processing

- Integration with payment service
- Payment verification and status updates
- Refund processing for cancelled orders

### Pricing Calculation

- Dynamic pricing based on distance, vehicle type, and package weight
- Tax calculation and itemized pricing details
- Rider commission calculation

### Event-Driven Architecture

- Kafka-based messaging for order status updates
- Notification service for order events
- Error handling and resilience in message processing

---

## Kubernetes Deployment

### Configuration Files

- **OrderService-configmap.yaml**: Configuration for port and payment service URL
- **OrderService-secret.yaml**: MongoDB connection string
- **OrderService-deployment.yaml**: Service deployment with resource limits and LoadBalancer

---

## API Endpoints

The service includes comprehensive API documentation using Swagger/OpenAPI at `/api-docs`

### Key Endpoints

| Endpoint                              | Method | Description                  | Required Scope    |
| ------------------------------------- | ------ | ---------------------------- | ----------------- |
| `/order/create`                       | POST   | Create a new delivery order  | `order.write`     |
| `/order/cancle/:order_id`             | POST   | Cancel an existing order     | `order.write`     |
| `/order/payment`                      | POST   | Process payment for an order | `order.write`     |
| `/order/updateStatus`                 | PUT    | Update order status          | `order.write`     |
| `/order/getAllOrders/user/:user_id`   | GET    | Get all orders for a user    | `order.read`      |
| `/order/getAllOrders/rider/:rider_id` | GET    | Get all orders for a rider   | `order.read`      |
| `/order/refund`                       | POST   | Process refund for an order  | `order.write`     |
| `/`                                   | GET    | Health check endpoint        | No authentication |

---

## Authentication

The service uses JWT-based authentication with scope-based authorization:

- `order.read` scope is required for read operations
- `order.write` scope is required for write operations

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
