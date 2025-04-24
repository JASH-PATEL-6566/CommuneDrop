# Commune Drop Ride Sharing Platform

![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Google Cloud Badge](https://img.shields.io/badge/Google%20Cloud-4285F4?logo=googlecloud&logoColor=fff&style=for-the-badge)
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-000?style=for-the-badge&logo=apachekafka)
![Amazon EKS Badge](https://img.shields.io/badge/Amazon%20EKS-F90?logo=amazoneks&logoColor=fff&style=for-the-badge)
![Supabase Badge](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=fff&style=for-the-badge)
![Stripe Badge](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=fff&style=for-the-badge)
![.NET Badge](https://img.shields.io/badge/.NET-512BD4?logo=dotnet&logoColor=fff&style=for-the-badge)
![React Badge](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000&style=for-the-badge)
![Node.js Badge](https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=fff&style=for-the-badge)
![Tailwind CSS Badge](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=fff&style=for-the-badge)
![Redis Badge](https://img.shields.io/badge/Redis-FF4438?logo=redis&logoColor=fff&style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000.svg?style=for-the-badge&logo=Express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101.svg?style=for-the-badge&logo=socketdotio&logoColor=white)

## Demo

https://github.com/user-attachments/assets/3206cf45-ed47-479b-aa5f-7d48ca64f0cc

## Overview

CommuneDrop is a comprehensive delivery tracking platform built with a modern microservice architecture. The platform enables real-time delivery tracking, secure payment processing, and efficient order management through a set of specialized microservices deployed on AWS EKS.

## System Architecture

<img width="663" alt="Screenshot 2025-04-22 at 11 03 15 PM" src="https://github.com/user-attachments/assets/2a1e43c2-4562-4842-9d44-c07ae39f351b" />

CommuneDrop is built on a robust microservice architecture with the following components:

### Microservices

| Service                 | Technology Stack                              | Purpose                                                |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------ |
| **AuthService**         | .NET, Duende Identity Server, MongoDB         | Authentication and authorization for all microservices |
| **Frontend Service**    | React, Vite, TailwindCSS, Socket.IO           | User interface and service coordination                |
| **LiveLocationService** | Node.js, Socket.IO, Kafka, MongoDB            | Real-time driver location tracking                     |
| **LocationService**     | Node.js, Express, AWS Location, Redis         | Geocoding and route calculation                        |
| **OrderService**        | Node.js, TypeScript, Express, MongoDB, Kafka  | Order management and status tracking                   |
| **PaymentService**      | Node.js, TypeScript, Express, MongoDB, Stripe | Payment processing and refund management               |

### Communication Flow

1. **Authentication**: All services authenticate through AuthService using OAuth2/OpenID Connect
2. **Order Creation**: Users create orders through the Frontend, which are processed by OrderService
3. **Payment Processing**: PaymentService handles secure payment transactions via Stripe
4. **Location Tracking**: LiveLocationService provides real-time driver location updates via Kafka and WebSockets
5. **Route Calculation**: LocationService calculates optimal routes and delivery estimates

## AuthService

A .NET-based authentication service built as a Duende Identity Server for microservice authorization.

**Key Features:**

- User Authentication & Authorization
- JWT-Based Authentication
- OAuth2 & OpenID Connect Support
- Scope-Based Access Control
- Secure Password Hashing

## Frontend Service

React-based user interface that coordinates communication between all microservices.

**Key Features:**

- Real-time delivery tracking on maps
- Live notifications for order updates
- Secure payment processing
- Order history and delivery estimates
- Service-to-Service Authentication with OAuth tokens

## LiveLocationService

Provides real-time location tracking between drivers and customers.

**Key Features:**

- Real-time Driver Location Tracking via WebSockets
- Order Notification System
- Bi-directional Communication
- Event-Driven Architecture with Kafka
- Geospatial queries for nearby driver discovery

## LocationService

Provides geocoding, route calculation, and location-based services.

**Key Features:**

- Address Geocoding
- Route Calculation with AWS Location Services
- Detailed Route Information
- Address Autocomplete
- Efficient Redis Caching

## OrderService

Manages delivery orders, status tracking, and payment processing.

**Key Features:**

- Order Creation
- Payment Processing
- Order Status Management
- Pricing Calculation
- Event-Driven Architecture with Kafka

## PaymentService

Handles all payment-related operations through Stripe integration.

**Key Features:**

- Customer Management
- Payment Method Handling
- Payment Processing
- Refund Management
- Order Status Updates

## Infrastructure as Code

The entire infrastructure is provisioned and managed using Terraform, enabling consistent, version-controlled deployment across environments.

### AWS EKS Cluster

The platform runs on Amazon EKS (Elastic Kubernetes Service) with the following components:

- **VPC Configuration**:

  - Custom VPC with public and private subnets across multiple availability zones
  - Internet Gateway for public access
  - NAT Gateway for private subnet outbound traffic
  - Security groups with appropriate ingress/egress rules

- **EKS Cluster**:

  - Kubernetes version 1.27
  - OIDC provider for service account IAM roles
  - Cluster logging enabled for audit and troubleshooting

- **Node Groups**:

  - Spot instances for cost optimization (t3.medium)
  - Auto-scaling configuration (1-3 nodes)
  - IAM roles with necessary permissions

- **Load Balancing**:
  - AWS Load Balancer Controller for ingress management
  - Automatic provisioning of Application Load Balancers
  - SSL/TLS termination support

### Kubernetes Resources

The `/Infrastructure/Kubernetes` directory contains:

- `egress-configuration.yaml`: Outbound traffic rules
- `ingress-commune-drop-configuration.yaml`: Ingress rules for the main application
- `ingress-live-location-configuration.yaml`: Ingress rules for the location service

## Getting Started

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform CLI
- kubectl
- Helm

### Deployment Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/CommuneDrop.git
cd CommuneDrop
```

2. **Initialize Terraform**

```shellscript
cd Infrastructure
terraform init
```

3. **Apply Terraform configuration**

```shellscript
terraform apply
```

4. **Configure kubectl**

```shellscript
aws eks update-kubeconfig --name eks-cluster --region us-east-1
```

5. **Deploy microservices**

```shellscript
kubectl apply -f Kubernetes/
```

6. **Verify deployment**

```shellscript
kubectl get pods --all-namespaces
```

## Technology Stack

### Backend Technologies

- **.NET Core**: Powers the AuthService with Duende Identity Server
- **Node.js**: Foundation for most microservices
- **Express**: Web framework for Node.js services
- **TypeScript**: Type-safe JavaScript for robust applications
- **MongoDB**: NoSQL database for flexible data storage
- **Redis**: In-memory caching for LocationService
- **Kafka**: Event streaming platform for real-time updates
- **Socket.IO**: Real-time bidirectional communication

### Frontend Technologies

- **React**: UI library for building the user interface
- **Vite**: Next-generation frontend tooling
- **TailwindCSS**: Utility-first CSS framework
- **Google Maps API**: Map visualization for location tracking
- **Supabase**: Authentication and database services

### DevOps & Infrastructure

- **Docker**: Containerization of all services
- **Kubernetes**: Container orchestration for deployment
- **Terraform**: Infrastructure as Code for cloud resources
- **AWS Services**:

- Amazon EKS
- VPC and networking components
- Load Balancer Controller
- IAM roles and policies

### Security

- **OAuth2 & OpenID Connect**: Industry-standard authentication protocols
- **JWT**: Secure token-based authentication
- **Stripe**: PCI-compliant payment processing

## Monitoring and Observability

- **Kubernetes Dashboard**: Visual management of cluster resources
- **AWS CloudWatch**: Metrics and logging
- **Prometheus & Grafana**: Advanced monitoring (planned)

## Security Considerations

- All services use JWT-based authentication
- Sensitive data is encrypted at rest and in transit
- API endpoints are protected with appropriate scopes
- Payment information is handled securely through Stripe
- Private subnets for sensitive workloads
- Security groups with least privilege access

## License

This project is licensed under the MIT License - see the LICENSE file for details.
