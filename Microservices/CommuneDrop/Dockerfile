# Build Stage
FROM node:18-alpine AS build

# Define build arguments for all Vite environment variables
# ConfigMap variables
ARG VITE_LOCATION_CLIENT_ID
ARG VITE_ORDER_CLIENT_ID
ARG VITE_SUPABASE_URL
ARG VITE_WEBSOCKET_URL
ARG VITE_PAYMENT_SERVICE_URL
ARG VITE_ORDER_SERVICE_URL
ARG VITE_LOCATION_SERVICE_URL
ARG VITE_API_BASE_URL

# Secret variables
ARG VITE_PUBLIC_GOOGLE_MAPS_API_KEY
ARG VITE_PUBLIC_STRIPE_API_KEY
ARG VITE_LOCATION_CLIENT_SECRET
ARG VITE_ORDER_CLIENT_SECRET
ARG VITE_SUPABASE_ANON_KEY

# Set working directory
WORKDIR /app

# Set environment variables from build args
# ConfigMap variables
ENV VITE_LOCATION_CLIENT_ID=${VITE_LOCATION_CLIENT_ID}
ENV VITE_ORDER_CLIENT_ID=${VITE_ORDER_CLIENT_ID}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}
ENV VITE_PAYMENT_SERVICE_URL=${VITE_PAYMENT_SERVICE_URL}
ENV VITE_ORDER_SERVICE_URL=${VITE_ORDER_SERVICE_URL}
ENV VITE_LOCATION_SERVICE_URL=${VITE_LOCATION_SERVICE_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Secret variables
ENV VITE_PUBLIC_GOOGLE_MAPS_API_KEY=${VITE_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV VITE_PUBLIC_STRIPE_API_KEY=${VITE_PUBLIC_STRIPE_API_KEY}
ENV VITE_LOCATION_CLIENT_SECRET=${VITE_LOCATION_CLIENT_SECRET}
ENV VITE_ORDER_CLIENT_SECRET=${VITE_ORDER_CLIENT_SECRET}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Copy package.json and package-lock.json
COPY package*.json ./
COPY server/package.json server/package-lock.json ./server/

# Install dependencies
RUN npm ci
WORKDIR /app/server
RUN npm ci --omit=dev
WORKDIR /app

# Copy all files
COPY . .

# Build frontend with environment variables
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Install dependencies for the server
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/server/package.json /app/server/package.json
RUN npm install --omit=dev

# Install serve for serving frontend
RUN npm install -g serve

# Copy built frontend assets
COPY --from=build /app/dist /app/dist
COPY --from=build /app/server /app/server

# Create health check endpoint
RUN mkdir -p /app/dist/health && \
    echo "OK" > /app/dist/health/index.html

# Expose ports for both frontend and WebSocket server
EXPOSE 5173 3001

# Start both frontend and WebSocket server
CMD ["sh", "-c", "serve -s dist -l 5173 & node server/websocket-server.js"]

