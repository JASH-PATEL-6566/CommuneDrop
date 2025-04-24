# CommuneDrop Microservices Platform

![Microservices](https://img.shields.io/badge/Architecture-Microservices-brightgreen)

This repository contains a collection of microservices that power the CommuneDrop delivery platform.

## Services

### [AuthService](./AuthService)

The AuthService handles user authentication, authorization, and user management.

### [CommuneDrop](./CommuneDrop)

The main application service that coordinates between other microservices.

### [LiveLocationService](./LiveLocationService)

The LiveLocationService tracks real-time location data for deliveries and riders.

### [LocationService](./LocationService)

The LocationService manages location data, geocoding, and route calculations.

### [OrderService](./OrderService)

The OrderService manages the entire order lifecycle from creation to delivery, integrates with payment services, and communicates order status changes.

### [PaymentService](./PaymentService)

The PaymentService handles all payment-related operations including customer management, payment method handling, payment processing, and refund management through Stripe integration.
