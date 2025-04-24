# LiveLocationService - Real-time Driver Location Tracking

![Node.js](https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101.svg?style=for-the-badge&logo=socketdotio&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20.svg?style=for-the-badge&logo=Apache-Kafka&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5.svg?style=for-the-badge&logo=Kubernetes&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=MongoDB&logoColor=white)

## Overview

LiveLocationService is a critical component of the CommuneDrop delivery platform, providing real-time location tracking between drivers and customers. This service enables seamless communication between drivers and customers by leveraging event-driven architecture with Kafka and WebSockets.

**Key Features:**

- **Real-time Driver Location Tracking**: Continuously broadcasts driver location updates to customers
- **Order Notification System**: Notifies available drivers about new delivery requests
- **Bi-directional Communication**: Enables real-time updates between drivers and customers
- **Event-Driven Architecture**: Utilizes Kafka for reliable, scalable message processing
- **Kubernetes Deployment**: Containerized and orchestrated for high availability and scalability

---

## Architecture

### Microservice Integration

LiveLocationService is part of a larger microservices ecosystem:

| Service                  | Interaction                                          |
| ------------------------ | ---------------------------------------------------- |
| **OrderService**         | Receives order notifications via Kafka               |
| **CommuneDrop Frontend** | Displays location updates to customers               |
| **PaymentService**       | Receives payment confirmations to notify drivers     |
| **AuthService**          | Validates user authentication for secure connections |

#### Data Flow

1. **Order Creation**: When a user creates an order through the Order Service, an event is published to Kafka
2. **Driver Notification**: LiveLocationService consumes these events and notifies available drivers
3. **Order Acceptance**: When a driver accepts an order, a dedicated Kafka topic is created for that specific user
4. **Location Tracking**: The driver's location is continuously published to the user-specific Kafka topic
5. **Customer Updates**: The customer frontend subscribes to this topic to receive real-time location updates

---

## Technologies

- **Frontend**: React.js with Google Maps integration
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.io for WebSocket connections
- **Message Broker**: Apache Kafka for event-driven architecture
- **Database**: MongoDB for trip and location data persistence
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
- Google Maps API key

### Quick Start

1. **Clone the repository**

   ```shellscript
   git clone https://github.com/yourusername/LiveLocationService.git
   cd LiveLocationService
   ```

2. **Install dependencies**

   ```shellscript
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` in both backend and frontend directories and fill in your configuration values.

4. **Start the development servers**

   ```shellscript
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd ../frontend
   npm start
   ```

---

## Configuration

### Environment Variables

#### Backend

```plaintext
# Server
PORT=5006
SOCKET_CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Kafka
USE_KAFKA=true
KAFKA_BROKER=localhost:9092
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=location-tracking-service
```

#### Frontend

```plaintext
# Server
PORT=3000

# API and Socket URLs
REACT_APP_SOCKET_URL=http://localhost:5006
REACT_APP_API_URL=http://localhost:5006/api

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## Project Structure

```plaintext
├── backend/                # Node.js backend service
│   ├── kafka/              # Kafka producers and consumers
│   ├── models/             # MongoDB data models
│   ├── routes/             # API routes
│   ├── socket/             # Socket.io handlers
│   └── server.js           # Main server entry point
├── frontend/               # React frontend application
│   ├── public/             # Static assets
│   └── src/                # React source code
│       ├── components/     # UI components
│       │   ├── Customer/   # Customer-facing components
│       │   └── Driver/     # Driver-facing components
│       └── styles/         # CSS styles
└── k8s/                    # Kubernetes configurations
    ├── LiveLocation-ConfigMap.yaml
    ├── LiveLocation-secret.yaml
    ├── LiveLocationService-deployment.yaml
    ├── LiveLocationFrontend-ConfigMap.yaml
    ├── LiveLocationFrontend-secret.yaml
    └── LiveLocationFrontend-deployment.yaml
```

---

## Key Features

### Real-time Location Tracking

- Uses HTML5 Geolocation API to track driver positions
- Updates sent via Socket.io to backend
- Backend publishes to Kafka topics for scalability
- Customer UI displays driver location on Google Maps

### Driver Notification System

- Kafka consumer listens for new order events
- Nearby drivers are notified based on geospatial queries
- Drivers can accept or reject delivery requests
- Order acceptance creates a dedicated tracking session

### User-specific Kafka Topics

- Each customer gets a dedicated Kafka topic
- Format: `user-updates-{userId}`
- Topics contain:

- Driver location updates
- Order status changes
- Estimated arrival times

---

## Kubernetes Deployment

### Configuration Files

- **LiveLocation-ConfigMap.yaml**: Backend environment configuration
- **LiveLocation-secret.yaml**: Sensitive backend data (MongoDB URI)
- **LiveLocationService-deployment.yaml**: Backend service deployment
- **LiveLocationFrontend-ConfigMap.yaml**: Frontend environment configuration
- **LiveLocationFrontend-secret.yaml**: Frontend API keys
- **LiveLocationFrontend-deployment.yaml**: Frontend service deployment

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

3. **Access the application**

   The service is exposed through a LoadBalancer. Get the external IP:

   ```shellscript
   kubectl get services live-location-frontend-service
   ```

---

## Scalability and Resilience

- **Horizontal Scaling**: Kubernetes automatically scales pods based on CPU/memory usage
- **Fault Tolerance**: Multiple replicas ensure high availability
- **Kafka Partitioning**: Location topics are partitioned for parallel processing
- **MongoDB Indexing**: Geospatial indexes for efficient driver discovery
- **Connection Recovery**: Automatic reconnection for WebSockets and Kafka

---

## Performance Optimizations

- **Debounced Location Updates**: Prevents excessive Kafka message production
- **Efficient WebSocket Management**: Optimized connection handling
- **Geospatial Indexing**: Fast driver discovery based on location
- **Selective Broadcasting**: Updates sent only to relevant subscribers
- **Caching**: Recent locations cached to reduce database load

---

## Monitoring and Debugging

- Health check endpoints for Kubernetes probes
- Detailed logging for troubleshooting
- Socket connection status tracking
- Kafka consumer group monitoring
- Debug panel for development environments

---

## Troubleshooting

### Common Issues

1. **WebSocket connection failures**

1. Check SOCKET_CORS_ORIGIN configuration
1. Verify network connectivity between services
1. Ensure proper Ingress configuration in Kubernetes

1. **Kafka connectivity issues**

1. Verify Kafka broker addresses
1. Check consumer group IDs for conflicts
1. Ensure topics exist with proper partitioning

1. **Location updates not reaching customers**

1. Confirm driver is sending location updates
1. Check user-specific Kafka topic creation
1. Verify WebSocket subscription to the correct room

1. **MongoDB connection errors**

1. Check connection string format
1. Verify network access to MongoDB cluster
1. Ensure proper authentication credentials

---

## Future Enhancements

- Implement gRPC for more efficient service-to-service communication
- Add machine learning for ETA prediction
- Implement geofencing for automated status updates
- Enhance security with OAuth 2.0 and JWT
- Add support for batch processing of location data

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
