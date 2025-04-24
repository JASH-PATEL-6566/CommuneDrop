# AuthService

![.NET Badge](https://img.shields.io/badge/.NET-512BD4?logo=dotnet&logoColor=fff&style=for-the-badge)
![MongoDB Badge](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=fff&style=for-the-badge)
![Docker Badge](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff&style=for-the-badge)

## Overview

AuthService is a .NET-based authentication service built as a **Duende Identity Server** for microservice authorization. It provides secure user authentication and authorization, defining scopes to manage access to microservice APIs. This service is designed to centralize authentication and authorization for distributed microservices, ensuring secure access control.

## Features

- **User Authentication & Authorization**: Supports user sign-up, sign-in, and role-based access control.
- **JWT-Based Authentication**: Issues JSON Web Tokens (JWT) for secure API communication.
- **OAuth2 & OpenID Connect Support**: Enables industry-standard authentication and authorization flows.
- **Scope-Based Access Control**: Defines API scopes to grant specific access levels to microservices.
- **Secure Password Hashing**: Uses best practices for storing and verifying passwords.
- **Customizable Configuration**: Supports environment-based configurations via `appsettings.json`.
- **Docker Deployment Support**: Easily deployable with Docker and Docker Compose.

## Architecture

AuthService acts as the central identity provider for microservices, issuing access tokens based on defined scopes. The authentication process follows these steps:

1. A client requests authentication by providing credentials.
2. The Identity Server validates credentials and issues a JWT.
3. The client uses the JWT to access microservices.
4. Each microservice validates the JWT and checks the assigned scopes before granting access.

## Folder Structure

```
AuthService/
│── AuthService.sln               # Solution file
│── compose.yaml                  # Docker Compose configuration
│── Dockerfile                    # Docker build file
│── appsettings.json               # Application configuration
│── .gitignore                     # Git ignore file
│── AuthService/
│   ├── AuthService.csproj        # Project file
│   ├── Program.cs                # Entry point of the application
│   ├── Startup.cs                # Application startup configuration
│   ├── Controllers/
│   │   ├── AuthController.cs      # Handles authentication requests
│   │   ├── UserController.cs      # Manages user-related operations
│   ├── Services/
│   │   ├── TokenService.cs        # Handles JWT generation
│   │   ├── UserService.cs         # Manages user authentication and authorization
│   ├── Models/
│   │   ├── User.cs                # User model definition
│   │   ├── TokenRequest.cs        # Model for token requests
│   ├── Config/
│   │   ├── IdentityConfig.cs      # Defines Identity Server settings
│   ├── Migrations/                # Database migrations (if applicable)
│── README.md                      # Documentation file
```

## Installation

### Prerequisites

- .NET SDK (version X.X)
- Docker (if using containerized deployment)
- PostgreSQL or SQL Server (if using a database for user storage)

### Setup

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd AuthService
   ```
2. Restore dependencies:
   ```sh
   dotnet restore
   ```
3. Configure environment variables in `appsettings.json`:
   ```json
   {
     "IdentityServer": {
       "Clients": {
         "ClientApp": {
           "ClientId": "client-id",
           "ClientSecret": "secret",
           "AllowedScopes": ["api.read", "api.write"]
         }
       }
     }
   }
   ```
4. Run the service:
   ```sh
   dotnet run
   ```

## Docker Deployment

To deploy using Docker:

```sh
docker build -t auth-service .
docker run -p 5000:5000 auth-service
```

Using Docker Compose:

```sh
docker-compose up -d
```

## API Endpoints

### Token Request

**Endpoint:** `/connect/token`
**Method:** `POST`
**Description:** Generates an access token for authentication.
**Example Request:**

```sh
curl -X POST "http://localhost:5000/connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=client-id&client_secret=secret&grant_type=client_credentials&scope=api.read"
```

### User Info

**Endpoint:** `/connect/userinfo`
**Method:** `GET`
**Description:** Retrieves user details from the token.

## Technologies Used

- **.NET Core**: Backend framework
- **Duende Identity Server**: Identity provider for OAuth2 and OpenID Connect
- **OAuth2 & OpenID Connect**: Authentication and authorization protocols
- **Docker & Docker Compose**: Containerized deployment
- **JSON Web Tokens (JWT)**: Secure API authentication
- **Entity Framework Core**: ORM for database interactions (if applicable)
- **PostgreSQL/SQL Server**: Database support (optional)

## Contributors

- Kandarp Patel

## License

This project is licensed under the MIT License.
