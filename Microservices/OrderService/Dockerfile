# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy only package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the compiled files from the build stage
COPY --from=build /app/dist ./dist

# Expose the port your application will run on
EXPOSE 9002

# Start the app using the compiled entry point
CMD ["node", "dist/server.js"]
