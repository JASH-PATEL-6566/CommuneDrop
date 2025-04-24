# CommuneDrop Frontend Service

![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF.svg?style=for-the-badge&logo=Vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20.svg?style=for-the-badge&logo=Apache-Kafka&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101.svg?style=for-the-badge&logo=socketdotio&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5.svg?style=for-the-badge&logo=Kubernetes&logoColor=white)

## Overview

CommuneDrop is a delivery tracking application with a microservice architecture. This repository contains the **Frontend Service** that provides the user interface and coordinates communication between all microservices.

**Key Features:**

- Real-time delivery tracking on maps
- Live notifications for order updates
- Secure payment processing
- Order history and delivery estimates

---

## Architecture

### Microservices

This frontend service communicates with:

| Service                 | Purpose                           |
| ----------------------- | --------------------------------- |
| **AuthService**         | Authentication and OAuth tokens   |
| **LiveLocationService** | Real-time driver location updates |
| **LocationService**     | Geocoding and route calculations  |
| **OrderService**        | Order management                  |
| **PaymentService**      | Payment processing via Stripe     |

### Communication Flow

#### Service Communication

1. **Service-to-Service Authentication:**

   - Frontend requests OAuth tokens from AuthService
   - Tokens with specific scopes authorize requests to other services

2. **Real-time Updates:**
   - Driver locations stream through Kafka topics
   - WebSocket server delivers updates to the frontend

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- Kubernetes (for production)
- API keys for:
  - Supabase
  - Google Maps
  - Stripe

### Quick Start

1. **Clone the repository**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

4. Copy `.env.example` to `.env`
5. Fill in your service URLs and API keys

6. **Start the development server**

   ```shellscript
   npm run dev
   ```

7. **Start the WebSocket server**

   ```shellscript
   cd server
   node websocket-server.js
   ```

---

## Configuration

### Environment Variables

```plaintext
# Authentication
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AUTH_SERVICE_URL=your_auth_service_url
VITE_CLIENT_ID=your_oauth_client_id
VITE_CLIENT_SECRET=your_oauth_client_secret

# Service URLs
VITE_PAYMENT_SERVICE_URL=your_payment_service_url
VITE_ORDER_SERVICE_URL=your_order_service_url
VITE_LOCATION_SERVICE_URL=your_location_service_url
VITE_LIVE_LOCATION_SERVICE_URL=your_live_location_service_url

# External APIs
VITE_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_PUBLIC_STRIPE_API_KEY=your_stripe_api_key

# WebSocket and Kafka
VITE_WEBSOCKET_URL=your_websocket_url
VITE_KAFKA_TOPIC_PREFIX=user-updates-

# Server
PORT=3001
```

---

## Project Structure

```plaintext
├── src/                  # Frontend React application
│   ├── components/       # UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Application pages
│   ├── services/         # API service clients
│   └── utils/            # Utility functions
├── server/               # WebSocket server
└── k8s/                  # Kubernetes configurations
```

---

## Authentication

### User Authentication

- Handled through Supabase
- Supports email/password and Google OAuth

### Service-to-Service Authentication

- OAuth-based system for secure microservice communication
- Frontend requests scoped access tokens from AuthService
- Each service validates tokens before processing requests

---

## Real-time Features

### Location Tracking

- LiveLocationService publishes to Kafka topics
- Format: `driver-location-{orderId}`
- WebSocket server subscribes to relevant topics
- Frontend displays updates on Google Maps

### Notifications

- Order status changes trigger notifications
- Delivered through WebSocket connection
- Topics format: `user-updates-{userId}`

---

## Payment Processing

- Secure integration with Stripe
- PaymentService handles all payment operations
- Frontend collects payment details
- Order confirmation after successful payment

---

## Deployment

### Kubernetes Deployment

1. **Update configuration files**

1. Edit `k8s/CommuneDrop-ConfigMap.yaml`
1. Edit `k8s/CommuneDrop-secret.yaml`

1. **Deploy the application**

```shellscript
kubectl apply -f k8s/
```

3. **Verify deployment**

```shellscript
kubectl get pods
kubectl get services
```

### Health Monitoring

- WebSocket server provides `/health` endpoint
- Returns Kafka connection status
- Shows number of connected users

---

## Troubleshooting

### Common Issues

1. **Connection errors to other services**

1. Check if OAuth tokens are being correctly requested
1. Verify service URLs in environment variables

1. **Real-time updates not working**

1. Ensure Kafka and WebSocket server are running
1. Check topic subscriptions in WebSocket server

1. **Payment processing failures**

1. Verify Stripe API keys
1. Check PaymentService logs for detailed errors
