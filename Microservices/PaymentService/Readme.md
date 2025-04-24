# PaymentService - Payment Processing API

![Node.js](https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000.svg?style=for-the-badge&logo=Express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD.svg?style=for-the-badge&logo=Stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED.svg?style=for-the-badge&logo=Docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5.svg?style=for-the-badge&logo=Kubernetes&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D.svg?style=for-the-badge&logo=Swagger&logoColor=black)
![Pino](https://img.shields.io/badge/Pino-00A86B.svg?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTEyIDZjLTMuMzEgMC02IDIuNjktNiA2czIuNjkgNiA2IDYgNi0yLjY5IDYtNi0yLjY5LTYtNi02eiIvPjwvc3ZnPg==)

## Overview

PaymentService is a critical component of our delivery platform, providing comprehensive payment processing capabilities. This microservice handles all payment-related operations including customer management, payment method handling, payment processing, and refund management through Stripe integration.

**Key Features:**

- **Customer Management**: Create and manage customer profiles in Stripe
- **Payment Method Handling**: Add, list, and delete payment methods securely
- **Payment Processing**: Process payments with Stripe integration
- **Refund Management**: Handle refunds for cancelled orders
- **Order Status Updates**: Communicate with OrderService to update order status after payment
- **Secure API**: Robust error handling and secure payment processing
- **Kubernetes Deployment**: Containerized and orchestrated for high availability
- **Comprehensive Documentation**: Swagger/OpenAPI for API documentation

---

## Architecture

### Microservice Integration

PaymentService is designed to integrate with other microservices in your ecosystem:

| Service          | Interaction                                              |
| ---------------- | -------------------------------------------------------- |
| **OrderService** | Updates order status after successful payment processing |

#### Data Flow

1. **Customer Creation**: User profile is created in Stripe when needed
2. **Payment Method Addition**: Payment methods are securely stored with Stripe
3. **Payment Processing**: Orders are paid for using stored payment methods
4. **Order Status Update**: OrderService is notified of successful payments
5. **Refund Processing**: Payments can be refunded when orders are cancelled

---

## Technologies

- **Backend**: Node.js with Express
- **Database**: MongoDB for payment record storage
- **Payment Gateway**: Stripe API integration
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
- Stripe account with API keys

### Quick Start

1. **Clone the repository**

   ```shellscript
   git clone https://github.com/yourusername/PaymentService.git
   cd PaymentService
   ```

2. **Install dependencies**

   ```shellscript
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your configuration values.

4. **Start the development server**

   ```shellscript
   npm run dev
   ```

5. **Access the API documentation**

   Open your browser and navigate to `http://localhost:9000/payment/api-docs`

---

## Configuration

### Environment Variables

```plaintext
# Server
PORT=9000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Order Service
ORDER_SERVICE_URL=http://order-service:80/order
```

---

## Project Structure

```plaintext
├── src/                    # Source code
│   ├── controllers/        # API controllers
│   │   └── payment.controller.ts
│   ├── db/                 # Database configuration
│   │   └── index.ts        # MongoDB connection
│   ├── models/             # Mongoose models
│   │   ├── customer-model.ts
│   │   ├── payment-method-model.ts
│   │   └── payment-model.ts
│   ├── routes/             # API routes
│   │   └── payment.routes.ts
│   ├── service/            # Business logic
│   │   ├── order-service.ts
│   │   └── stripe-service.ts
│   ├── types/              # TypeScript type definitions
│   │   └── stripe-api.types.ts
│   ├── utils/              # Utility functions
│   │   ├── logger/         # Logging utilities
│   │   ├── index.ts
│   │   └── stripe-api.ts   # Stripe API utilities
│   ├── express-app.ts      # Express application setup
│   ├── server.ts           # Main server entry point
│   └── swagger.ts          # Swagger documentation
├── k8s/                    # Kubernetes configurations
│   ├── PaymentService-configmap.yaml
│   ├── PaymentService-secret.yaml
│   └── PaymentService-deployment.yaml
└── package.json            # Project dependencies
```

---

## Key Features

### Customer Management

- Create new customers in Stripe and local database
- Retrieve customer information by email
- Synchronize customer data between local database and Stripe

### Payment Method Handling

- Add new payment methods to customer profiles
- Store card details securely through Stripe
- List all payment methods for a customer
- Delete payment methods with proper default card management
- Set default payment methods for customers

### Payment Processing

- Create payment intents through Stripe
- Process payments with proper error handling and timeout management
- Store payment records in local database
- Communicate with OrderService to update order status after successful payment
- Handle payment failures gracefully

### Refund Management

- Process full or partial refunds
- Update payment records with refund information
- Proper error handling for refund failures

### Security and Error Handling

- Secure Stripe API communication
- Timeout handling for API requests
- Comprehensive error logging
- Graceful error responses to clients
- Retry mechanisms for order status updates

---

## Kubernetes Deployment

### Configuration Files

- **PaymentService-configmap.yaml**: Non-sensitive configuration (port, order service URL, node environment)
- **PaymentService-secret.yaml**: Sensitive data (MongoDB connection string, Stripe API key)
- **PaymentService-deployment.yaml**: Service deployment and LoadBalancer

### Deployment Steps

1. **Apply Kubernetes configurations**

   ```shellscript
   kubectl apply -f k8s/
   ```

2. **Verify deployments**

   ```shellscript
   kubectl get deployments
   kubectl get pods
   kubectl get services
   ```

3. **Access the service**

   The service is exposed through a LoadBalancer. Get the external IP:

   ```shellscript
   kubectl get services payment-service
   ```

---

## Scalability and Resilience

- **Horizontal Scaling**: Kubernetes deployment supports scaling
- **Resource Limits**: Configured memory and CPU limits in deployment
- **Error Handling**: Comprehensive error handling with appropriate status codes
- **MongoDB Connection Resilience**: Connection handling for database
- **Stripe API Resilience**: Timeout handling for API requests

---

## Performance Optimizations

- **Efficient Database Queries**: Proper indexing in MongoDB models
- **Structured Logging**: Production-appropriate logging levels with Pino
- **Request Validation**: Input validation in controllers
- **Stripe API Timeouts**: Different timeouts for different operations

---

## Monitoring and Debugging

- **Health Check Endpoint**: `/` endpoint returns health status
- **Structured Logging**: JSON-formatted logs with Pino
- **Error Classification**: Detailed error information for troubleshooting
- **Stripe API Logging**: Detailed logging of Stripe API requests and responses

---

## API Documentation

The service includes comprehensive API documentation using Swagger/OpenAPI:

- **Interactive Documentation**: Available at `/payment/api-docs` endpoint
- **Request/Response Examples**: Sample payloads for all endpoints
- **Schema Definitions**: Detailed data models

### Key Endpoints

| Endpoint                               | Method | Description                                 |
| -------------------------------------- | ------ | ------------------------------------------- |
| `/payment/customer/:email`             | GET    | Get a customer by email                     |
| `/payment/customer`                    | POST   | Create a new customer                       |
| `/payment/payment-method`              | POST   | Add a new payment method                    |
| `/payment/payment-method-details`      | POST   | Add a payment method with details           |
| `/payment/payment-method`              | DELETE | Delete a payment method                     |
| `/payment/payment-methods/:customerId` | GET    | List all payment methods for a customer     |
| `/payment/payment-intent`              | POST   | Create a payment intent and process payment |
| `/payment/refund`                      | POST   | Process a refund                            |
| `/`                                    | GET    | Health check endpoint                       |

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
