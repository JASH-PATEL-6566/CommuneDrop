import dotenv from "dotenv"
dotenv.config()

// AWS Configuration
export const AWS_CONFIG = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
}

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SUGGESTIONS: Number.parseInt(process.env.CACHE_TTL_SUGGESTIONS || "86400", 10), // 24 hours
  COORDINATES: Number.parseInt(process.env.CACHE_TTL_COORDINATES || "2592000", 10), // 30 days
  ROUTES: Number.parseInt(process.env.CACHE_TTL_ROUTES || "604800", 10), // 7 days
}

// Server configuration
export const SERVER_CONFIG = {
  PORT: Number.parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
}

// API configuration
export const API_CONFIG = {
  API_KEY: process.env.API_KEY,
}

