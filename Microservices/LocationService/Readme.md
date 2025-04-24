# LocationService - Geocoding and Route Calculation API

![Node.js](https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000.svg?style=for-the-badge&logo=Express&logoColor=white)
![AWS](https://img.shields.io/badge/Amazon%20AWS-232F3E.svg?style=for-the-badge&logo=Amazon-AWS&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D.svg?style=for-the-badge&logo=Redis&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5.svg?style=for-the-badge&logo=Kubernetes&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D.svg?style=for-the-badge&logo=Swagger&logoColor=black)

## Overview

LocationService is a critical component of our platform, providing geocoding, route calculation, and location-based services. This microservice leverages AWS Location Services for accurate geocoding and routing while implementing efficient caching strategies with Redis to optimize performance and reduce costs.

**Key Features:**

- **Address Geocoding**: Convert addresses to geographic coordinates (latitude/longitude)
- **Route Calculation**: Determine distance and travel time between locations
- **Detailed Route Information**: Get step-by-step directions with waypoints
- **Address Autocomplete**: Provide address suggestions for user input
- **Efficient Caching**: Redis-based caching system for frequently accessed data
- **Secure API**: JWT-based authentication with role-based access control
- **Kubernetes Deployment**: Containerized and orchestrated for high availability

---

## Architecture

### Microservice Integration

LocationService is designed to integrate with other microservices in your ecosystem:

| Service             | Interaction                                        |
| ------------------- | -------------------------------------------------- |
| **OrderService**    | Requests route calculations for delivery estimates |
| **DriverService**   | Uses geocoding for driver location management      |
| **CustomerService** | Leverages address suggestions for user profiles    |
| **AuthService**     | Validates JWT tokens for secure API access         |

#### Data Flow

1. **Request Authentication**: All requests are authenticated using JWT tokens
2. **Cache Check**: System checks Redis cache for previously computed results
3. **AWS Integration**: If not cached, requests are forwarded to AWS Location Services
4. **Response Caching**: Results are cached in Redis with appropriate TTL values
5. **Response Delivery**: Formatted data is returned to the requesting service

---

## Technologies

- **Backend**: Node.js with Express
- **Geocoding & Routing**: AWS Location Services
- **Caching**: Redis for performance optimization
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
- Redis instance
- AWS account with Location Services configured
- AWS Place Index and Route Calculator resources

### Quick Start

1. **Clone the repository**

   ```shellscript
   git clone https://github.com/yourusername/LocationService.git
   cd LocationService

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

   Open your browser and navigate to `http://localhost:5001/api-docs`

---

## Configuration

### Environment Variables

```plaintext
# Server
PORT=5001
NODE_ENV=development
LOG_LEVEL=info

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache TTL (seconds)
CACHE_TTL_SUGGESTIONS=86400
CACHE_TTL_COORDINATES=2592000
CACHE_TTL_ROUTES=604800

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_PLACE_INDEX=Place-Index-1
AWS_ROUTE_CALCULATOR=Route-Calculator-1

# Authentication
JWT_SECRET=your_jwt_secret_key
```

---

## Project Structure

```plaintext
├── src/                    # Source code
│   ├── config/             # Configuration files
│   │   ├── index.ts        # Main configuration
│   │   └── redis.ts        # Redis configuration
│   ├── controllers/        # API controllers
│   │   ├── cache.controller.ts
│   │   └── location.controller.ts
│   ├── dto/                # Data Transfer Objects
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── repository/         # Data access layer
│   ├── routes/             # API routes
│   │   ├── doc.routes.ts
│   │   └── location.routes.ts
│   ├── service/            # Business logic
│   │   └── location.service.ts
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── error/          # Error handling
│   │   ├── logger/         # Logging utilities
│   │   └── performance.ts  # Performance tracking
│   ├── express-app.ts      # Express application setup
│   ├── server.ts           # Main server entry point
│   └── swagger.ts          # Swagger documentation
├── k8s/                    # Kubernetes configurations
│   ├── LocationService-configmap.yaml
│   ├── LocationService-secret.yaml
│   └── LocationService-deployment.yaml
└── package.json            # Project dependencies
```

---

## Key Features

### Geocoding

- Converts addresses to geographic coordinates (latitude/longitude)
- Leverages AWS Place Index for accurate results
- Implements efficient caching to reduce API calls
- Supports international addresses with country filtering

### Route Calculation

- Calculates distance and travel time between two addresses
- Provides detailed route information with step-by-step directions
- Returns route geometry for map visualization
- Optimizes for different travel modes (currently supports Car)

### Address Suggestions

- Provides real-time address suggestions for user input
- Implements autocomplete functionality for better user experience
- Supports language preferences and result filtering
- Gracefully handles fallback scenarios for different AWS Place Index configurations

### Caching System

- Redis-based caching for all API operations
- Configurable TTL values for different data types:

- Address suggestions: 24 hours (configurable)
- Coordinates: 30 days (configurable)
- Routes: 7 days (configurable)

- Cache key generation based on request parameters
- Admin endpoints for cache management

---

## Kubernetes Deployment

### Configuration Files

- **LocationService-configmap.yaml**: Non-sensitive configuration
- **LocationService-secret.yaml**: Sensitive data (AWS credentials, JWT secret)
- **LocationService-deployment.yaml**: Service deployment and LoadBalancer

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
   kubectl get services location-service
   ```

---

## Scalability and Resilience

- **Horizontal Scaling**: Kubernetes automatically scales pods based on CPU/memory usage
- **Resource Limits**: Configured memory and CPU limits for predictable performance
- **Health Checks**: Readiness and liveness probes for reliable operation
- **Graceful Shutdown**: Proper handling of termination signals
- **Error Handling**: Comprehensive error handling with appropriate status codes
- **Redis Resilience**: Retry strategy for Redis connection failures

---

## Performance Optimizations

- **Efficient Caching**: Multi-level caching strategy to minimize AWS API calls
- **Performance Tracking**: Timing of critical operations for monitoring
- **Optimized Logging**: Production-appropriate logging levels
- **HTTP Headers**: Security headers and compression for optimal delivery
- **Request ID Tracking**: Unique identifiers for request tracing
- **Selective Response Fields**: Only necessary data returned to clients

---

## Monitoring and Debugging

- **Health Check Endpoint**: `/health` endpoint for monitoring
- **Structured Logging**: JSON-formatted logs with request context
- **Performance Metrics**: Timing information for key operations
- **Request Tracing**: Request IDs propagated through the system
- **Error Classification**: Detailed error information for troubleshooting
- **Cache Statistics**: Endpoints for monitoring cache effectiveness

---

## API Documentation

The service includes comprehensive API documentation using Swagger/OpenAPI:

- **Interactive Documentation**: Available at `/api-docs` endpoint
- **Authentication Details**: Information about required JWT tokens and scopes
- **Request/Response Examples**: Sample payloads for all endpoints
- **Error Responses**: Documentation of possible error conditions
- **Schema Definitions**: Detailed data models

### Key Endpoints

| Endpoint                  | Method | Description                       | Required Scope    |
| ------------------------- | ------ | --------------------------------- | ----------------- |
| `/location/autocomplete`  | GET    | Get address suggestions           | `location.read`   |
| `/location/geocode`       | POST   | Convert address to coordinates    | `location.read`   |
| `/location/matrix`        | POST   | Calculate distance and duration   | `location.read`   |
| `/location/route`         | POST   | Get detailed route with waypoints | `location.read`   |
| `/location/cache`         | DELETE | Clear all cache                   | `location.admin`  |
| `/location/cache/:prefix` | DELETE | Clear cache by prefix             | `location.admin`  |
| `/location/cache/stats`   | GET    | Get cache statistics              | `location.admin`  |
| `/location/health`        | GET    | Health check endpoint             | No authentication |

---

## Troubleshooting

### Common Issues

1. **AWS Authentication Failures**

1. Check AWS credentials in environment variables
1. Verify IAM permissions for Location Services
1. Ensure AWS region is correctly configured

1. **Redis Connection Issues**

1. Verify Redis host and port configuration
1. Check network connectivity to Redis instance
1. Ensure Redis password is correct (if applicable)

1. **JWT Authentication Problems**

1. Verify JWT secret is correctly configured
1. Check token expiration and scope claims
1. Ensure client is sending token in Authorization header

1. **Route Calculation Errors**

1. Verify addresses are valid and recognized by AWS
1. Check AWS Route Calculator resource configuration
1. Ensure coordinates are within supported regions

---

## Future Enhancements

- Add support for multiple travel modes (walking, cycling, public transit)
- Implement geofencing capabilities
- Add support for batch geocoding operations
- Integrate with additional geocoding providers for fallback
- Implement rate limiting for API protection
- Add support for real-time traffic information
- Enhance address validation and normalization

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
