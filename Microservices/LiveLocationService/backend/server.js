import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import { fileURLToPath } from "url"
import { dirname } from "path"
import mongoose from "mongoose"
import tripRoutes from "./routes/trips.js"
import { handleSocketConnections } from "./socket/socketHandler.js"
import { setupKafkaProducer, setupKafkaConsumer } from "./kafka/kafkaSetup.js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize express app
const app = express()
const server = http.createServer(app)

// Get port from environment variable or use default
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/trips", tripRoutes)

// Update the Socket.io setup with CORS configuration
// Replace the existing Socket.io initialization code with this:

// Socket.io setup with CORS configuration
const io = new Server(server, {
  path: "/socket.io", // Explicitly set path to match Ingress configuration
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "*", // Use environment variable or allow all origins
    methods: ["GET", "POST"],
    credentials: false, // Changed to false for simpler CORS handling
    allowedHeaders: ["*"],
  },
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000, // Increase ping interval
  transports: ["websocket", "polling"], // Support both transport methods
})

// Add a health check endpoint for Socket.IO
app.get("/socket.io/health", (req, res) => {
  res.status(200).send("Socket.IO server is running")
})

// Add this for debugging
console.log(
  `Socket.io server configured with path: /socket.io and CORS origin: ${process.env.SOCKET_CORS_ORIGIN || "*"}`,
)

// Connect to MongoDB - Fix the database name case sensitivity issue
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Web_Project:yI2PgSA5kN7SZCXJ@web-term-project.0xq4w.mongodb.net/CommuneDrop?retryWrites=true&w=majority&appName=Web-Term-Project"

// Ensure we're using the correct database name with consistent casing
// Extract the database name from the connection string to check if it exists
const dbNameMatch = MONGODB_URI.match(/\/([^/]+)(?:\?|$)/)
const dbName = dbNameMatch ? dbNameMatch[1] : "location-tracker"

console.log(`Connecting to MongoDB database: ${dbName}`)

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)

    // If the error is related to database name case sensitivity, provide a helpful message
    if (err.code === 13297) {
      console.error(`
==========================================================================
DATABASE NAME CASE SENSITIVITY ERROR DETECTED

The MongoDB database name has a case sensitivity conflict.
Error: ${err.message}

Please ensure you're using the exact same database name in all connections.
If you've previously used "CommuneDrop", make sure to use "CommuneDrop" 
(not "communedrop") in your connection string.

You can fix this by updating your MONGODB_URI environment variable to use
the correct database name case.
==========================================================================
      `)
    }
  })

// Modify the Kafka setup to ensure we properly log the status
// Setup Kafka producer and consumer
let kafkaProducer = null
let kafkaConsumer = null

try {
  // Check if Kafka is enabled via environment variable
  const useKafka = process.env.USE_KAFKA === "true"
  console.log(`Kafka integration ${useKafka ? "enabled" : "disabled"}`)

  if (useKafka) {
    // Initialize Kafka producer
    kafkaProducer = setupKafkaProducer()

    // Initialize Socket.io handler first to get the broadcast function
    const socketHandler = handleSocketConnections(io, kafkaProducer)

    // Initialize Kafka consumer and pass the Socket.io instance
    // so it can forward messages to connected clients
    kafkaConsumer = setupKafkaConsumer(io)

    console.log("Kafka producer and consumer initialized successfully")

    // Broadcast Kafka status to all connected clients
    setTimeout(() => {
      io.emit("serverConfig", { kafkaEnabled: true })
      console.log("Broadcasted Kafka enabled status to all clients")
    }, 5000) // Wait 5 seconds to ensure Kafka is fully connected
  } else {
    console.log("Kafka integration disabled by configuration")
    // Initialize Socket.io handler
    handleSocketConnections(io, kafkaProducer)
    io.emit("serverConfig", { kafkaEnabled: false })
  }
} catch (error) {
  console.error("Error initializing Kafka:", error)
  kafkaProducer = null
  kafkaConsumer = null
  // Initialize Socket.io handler even if Kafka fails
  handleSocketConnections(io, null)
  io.emit("serverConfig", { kafkaEnabled: false })
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Kafka integration: ${process.env.USE_KAFKA === "true" ? "Enabled" : "Disabled"}`)
})

export default app

