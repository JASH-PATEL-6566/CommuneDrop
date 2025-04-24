// At the beginning of the file, add a variable to track Kafka status
const activeDrivers = new Map()
const activeCustomers = new Map()
const tripSubscriptions = new Map()
// Store the latest driver locations
const driverLocations = new Map()
// Track if Kafka is enabled
let isKafkaEnabled = false
// Import the function to send to user topic
import { sendToUserTopic, createUserSpecificTopic } from "../kafka/driverNotificationService.js"
import mongoose from "mongoose"

export const handleSocketConnections = (io, kafkaProducer) => {
  // Set Kafka status based on the producer
  isKafkaEnabled = kafkaProducer !== null && typeof kafkaProducer === "object"
  console.log(`Socket handler initialized with Kafka ${isKafkaEnabled ? "enabled" : "disabled"}`)

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id)

    // Send server configuration to the client immediately after connection
    socket.emit("serverConfig", {
      kafkaEnabled: isKafkaEnabled,
    })

    // Driver connected
    socket.on("driverConnected", (data) => {
      console.log("Driver connected:", data.driverId, "with socket ID:", socket.id)
      activeDrivers.set(data.driverId, socket.id)

      // Join driver-specific room
      socket.join(`driver:${data.driverId}`)
      console.log(`Driver joined room: driver:${data.driverId}`)

      // If driver has an active trip, join that trip's room
      if (data.tripId) {
        socket.join(`trip:${data.tripId}`)
        console.log(`Driver joined room: trip:${data.tripId}`)
      }

      // Send server configuration again to ensure driver has it
      socket.emit("serverConfig", {
        kafkaEnabled: isKafkaEnabled,
      })
    })

    // Customer connected
    socket.on("customerConnected", (data) => {
      console.log("Customer connected:", data.customerId, "for trip:", data.tripId, "with socket ID:", socket.id)
      activeCustomers.set(data.customerId, socket.id)

      // Subscribe to trip updates by joining the trip's room
      if (data.tripId) {
        socket.join(`trip:${data.tripId}`)
        console.log(`Customer joined room: trip:${data.tripId}`)

        // Send the latest driver location if available
        const latestLocation = driverLocations.get(data.tripId)
        if (latestLocation) {
          console.log("Sending latest driver location to new customer:", latestLocation)
          socket.emit("driverLocationUpdate", {
            tripId: data.tripId,
            location: latestLocation,
            source: "cache", // Add source for debugging
          })
        } else {
          console.log("No driver location available for requested trip")
        }
      }
    })

    // Customer requests driver location
    socket.on("requestDriverLocation", (data) => {
      if (!data || !data.tripId) {
        console.error("Invalid request for driver location:", data)
        return
      }

      console.log("Customer requested driver location for trip:", data.tripId)

      // Send the latest stored location if available
      const latestLocation = driverLocations.get(data.tripId)
      if (latestLocation) {
        console.log("Sending requested driver location:", latestLocation)
        socket.emit("driverLocationUpdate", {
          tripId: data.tripId,
          location: latestLocation,
          source: "cache", // Add source for debugging
        })
      } else {
        console.log("No driver location available for requested trip")
      }
    })

    // Add a handler for getTripDetails event (around line 120)
    // Trip details request
    socket.on("getTripDetails", async (data) => {
      if (!data || !data.tripId) {
        console.error("Invalid request for trip details:", data)
        return
      }

      console.log("Client requested trip details for trip:", data.tripId)

      try {
        // Fetch trip details from database
        const Trip = mongoose.model("Trip")
        const tripDetails = await Trip.findOne({ id: data.tripId })

        if (tripDetails) {
          console.log("Found trip details, sending to client")
          socket.emit("tripDetails", tripDetails)
        } else {
          console.log("No trip found with ID:", data.tripId)
          socket.emit("tripDetails", null)
        }
      } catch (error) {
        console.error("Error fetching trip details:", error)
        socket.emit("tripDetails", null)
      }
    })

    // Driver location update
    socket.on("driverLocationUpdate", async (data) => {
      // Validate location data
      if (!data || !data.tripId) {
        console.error("Invalid driver location update data (missing tripId):", data)
        return
      }

      if (!data.location || typeof data.location.lat !== "number" || typeof data.location.lng !== "number") {
        console.error("Invalid driver location coordinates:", data.location)
        return
      }

      console.log("Driver location update for trip:", data.tripId, data.location)

      // Store the latest location
      driverLocations.set(data.tripId, data.location)

      // If Kafka is enabled, send to Kafka
      if (kafkaProducer) {
        try {
          const sent = await kafkaProducer.sendLocationUpdate(data.tripId, data.location)
          if (sent) {
            console.log("Location update sent to Kafka successfully")
          } else {
            console.warn("Failed to send to Kafka, falling back to Socket.io")
          }
        } catch (error) {
          console.error("Error sending to Kafka, falling back to Socket.io:", error)
        }
      }

      // Broadcast directly via Socket.io
      io.to(`trip:${data.tripId}`).emit("driverLocationUpdate", {
        tripId: data.tripId,
        location: data.location,
        source: "socket", // Add source for debugging
      })

      // Also send location update to the user's Kafka topic if we have the trip details
      try {
        const Trip = mongoose.model("Trip")
        const tripDetails = await Trip.findOne({ id: data.tripId })

        if (tripDetails && tripDetails.customerId && isKafkaEnabled) {
          // Extract the orderId from packageDetails (e.g., "Order #123" -> "123")
          const orderId = tripDetails.packageDetails.replace("Order #", "")

          // Prepare the event in the exact format required
          const locationEvent = {
            eventType: "DriverLiveLocation",
            orderId: orderId,
            timestamp: Date.now(),
            data: {
              message: "Driver location updated",
              location: {
                lat: data.location.lat,
                lng: data.location.lng,
                heading: 180, // Default heading if not provided
                speed: 35, // Default speed if not provided
              },
            },
          }

          // Send location update to user-specific topic
          await sendToUserTopic(tripDetails.customerId, locationEvent)
          console.log(`Sent driver location update to user topic for user ${tripDetails.customerId}`)
        }
      } catch (error) {
        console.error("Error sending location update to user topic:", error)
      }
    })

    // Trip status update
    socket.on("tripStatusUpdate", async (data) => {
      console.log("Trip status update:", data.tripId, data.status)

      // If Kafka is enabled, send to Kafka
      if (kafkaProducer) {
        try {
          const sent = await kafkaProducer.sendTripStatusUpdate(data.tripId, data.status)
          if (sent) {
            console.log("Status update sent to Kafka successfully")
          } else {
            console.warn("Failed to send to Kafka, falling back to Socket.io")
          }
        } catch (error) {
          console.error("Error sending to Kafka, falling back to Socket.io:", error)
        }
      }

      // Broadcast directly via Socket.io
      io.to(`trip:${data.tripId}`).emit("tripStatusUpdate", {
        tripId: data.tripId,
        status: data.status,
        source: "socket", // Add source for debugging
      })

      // Also send status update to the user's Kafka topic if we have the trip details
      try {
        const Trip = mongoose.model("Trip")
        const tripDetails = await Trip.findOne({ id: data.tripId })

        if (tripDetails && tripDetails.customerId && isKafkaEnabled) {
          // Map internal status to user-facing status
          const statusMap = {
            pickup: "AWAITING_PICKUP",
            delivering: "IN_TRANSIT",
            completed: "DELIVERED",
          }

          const userStatus = statusMap[data.status] || data.status.toUpperCase()

          // Extract the orderId from packageDetails (e.g., "Order #123" -> "123")
          const orderId = tripDetails.packageDetails.replace("Order #", "")

          // Get status message
          const statusMessage = getStatusMessage(data.status)

          // Prepare the event in the exact format required
          const statusEvent = {
            eventType: "OrderStatusUpdated",
            orderId: orderId,
            timestamp: Date.now(),
            data: {
              status: userStatus,
              estimatedArrival: data.status === "completed" ? "Delivered" : "10 minutes",
              message: statusMessage,
            },
          }

          // Send status update to user-specific topic
          await sendToUserTopic(tripDetails.customerId, statusEvent)
          console.log(`Sent trip status update to user topic for user ${tripDetails.customerId}`)
        }
      } catch (error) {
        console.error("Error sending status update to user topic:", error)
      }
    })

    // Trip accepted
    socket.on("tripAccepted", async (data) => {
      console.log("Trip accepted:", data.tripId, "by driver:", data.driverId)

      // Join the trip room if not already joined
      socket.join(`trip:${data.tripId}`)

      // Broadcast to all clients in the trip room
      io.to(`trip:${data.tripId}`).emit("tripStatusUpdate", {
        tripId: data.tripId,
        status: "pickup",
        source: "socket",
      })

      // If Kafka is enabled, send to Kafka
      if (kafkaProducer) {
        try {
          const sent = await kafkaProducer.sendTripStatusUpdate(data.tripId, "pickup")
          if (sent) {
            console.log("Trip acceptance sent to Kafka successfully")
          }
        } catch (error) {
          console.error("Error sending trip acceptance to Kafka:", error)
        }
      }
    })

    // New handler for accepting order from notification
    socket.on("acceptOrderFromNotification", async (data) => {
      console.log("Order accepted from notification:", data)

      const { orderId, userId, from_address, to_address, amount, driverId, pickupLocation, dropoffLocation } = data

      // Get the driver's current location if available
      const currentLocation = data.currentLocation || null

      // Generate a trip ID
      const tripId = `T${Math.floor(Math.random() * 100000)}`

      // Ensure we have valid location objects
      const validPickupLocation = {
        address: from_address,
        lat: pickupLocation?.lat || 44.643,
        lng: pickupLocation?.lng || -63.5793,
      }

      const validDropoffLocation = {
        address: to_address,
        lat: dropoffLocation?.lat || 44.6418,
        lng: dropoffLocation?.lng || -63.5784,
      }

      console.log("Creating trip with pickup location:", validPickupLocation)
      console.log("Creating trip with dropoff location:", validDropoffLocation)

      // Create a new trip object
      const newTrip = {
        id: tripId,
        driverId: driverId,
        customerId: userId,
        status: "pickup",
        pickupLocation: validPickupLocation,
        dropoffLocation: validDropoffLocation,
        packageDetails: `Order #${orderId}`,
        price: amount,
        estimatedTime: "15 min",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      try {
        // Save the trip to the database if possible
        const Trip = mongoose.model("Trip")
        const savedTrip = new Trip(newTrip)
        await savedTrip.save()
        console.log(`Trip ${tripId} saved to database`)
      } catch (error) {
        console.error("Error saving trip to database:", error)
        // Continue with the in-memory trip object even if DB save fails
      }

      // Create a user-specific Kafka topic if Kafka is enabled
      if (isKafkaEnabled && userId) {
        try {
          // Create the topic
          await createUserSpecificTopic(userId)

          // Get driver information
          const driverInfo = {
            id: "driver_123",
            name: "Michael Chen",
            rating: 4.8,
            trips: 1243,
            vehicleType: "Toyota Prius",
            vehicleNumber: "ABC 123",
            image: "/placeholder.svg?height=100&width=100",
          }

          // Prepare the event in the exact format required
          const orderAcceptedEvent = {
            eventType: "Order Accepted",
            orderId: orderId,
            timestamp: Date.now(),
            data: {
              status: "AWAITING_PICKUP",
              estimatedArrival: "5 minutes",
              message: "Driver has accepted your order",
              driver: driverInfo,
              location: currentLocation || { lat: 44.6470226, lng: -63.5942508 },
            },
          }

          // Send structured notification to the user topic
          await sendToUserTopic(userId, orderAcceptedEvent)

          console.log(`Sent order acceptance notification to user ${userId}`)
        } catch (error) {
          console.error("Error sending notification to user topic:", error)
        }
      }

      // Emit trip assigned event to the driver
      socket.emit("tripAssigned", newTrip)

      // Join the trip room
      socket.join(`trip:${tripId}`)

      // Broadcast trip status update
      io.to(`trip:${tripId}`).emit("tripStatusUpdate", {
        tripId: tripId,
        status: "pickup",
        source: "socket",
      })

      // Store the trip ID for this driver
      const driverSocketId = activeDrivers.get(driverId)
      if (driverSocketId) {
        tripSubscriptions.set(driverId, tripId)
      }

      // Return confirmation
      socket.emit("orderAcceptanceConfirmed", {
        success: true,
        tripId: tripId,
        message: "Order accepted successfully",
      })
    })

    // Trip rejected
    socket.on("tripRejected", (data) => {
      console.log("Trip rejected:", data.tripId, "by driver:", data.driverId)

      // Broadcast to all clients in the trip room
      io.to(`trip:${data.tripId}`).emit("tripRejected", {
        tripId: data.tripId,
        driverId: data.driverId,
      })
    })

    // Add a handler for getServerConfig event
    socket.on("getServerConfig", () => {
      console.log("Client requested server configuration")
      socket.emit("serverConfig", {
        kafkaEnabled: isKafkaEnabled,
      })
    })

    // Handle order cancellation
    socket.on("cancelOrder", async (data) => {
      console.log("Order cancellation request:", data)

      const { orderId, userId, reason } = data

      if (orderId && userId) {
        await sendOrderCancellationNotification(userId, orderId, reason)

        // Broadcast to all drivers that this order is no longer available
        io.emit("orderCancelled", {
          orderId,
          userId,
          timestamp: new Date().toISOString(),
        })

        socket.emit("orderCancellationConfirmed", {
          success: true,
          orderId,
          message: "Order cancelled successfully",
        })
      } else {
        socket.emit("orderCancellationConfirmed", {
          success: false,
          message: "Missing required information",
        })
      }
    })

    // Disconnect event
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)

      // Remove from active connections
      for (const [driverId, socketId] of activeDrivers.entries()) {
        if (socketId === socket.id) {
          activeDrivers.delete(driverId)
          break
        }
      }

      for (const [customerId, socketId] of activeCustomers.entries()) {
        if (socketId === socket.id) {
          activeCustomers.delete(customerId)
          break
        }
      }
    })
  })

  // Function to broadcast notifications to all online drivers
  // This can be called from other parts of the application
  return {
    broadcastToDrivers: (notification) => {
      console.log(`Broadcasting notification to ${activeDrivers.size} active drivers:`, notification)

      // Send to all active drivers
      for (const [driverId, socketId] of activeDrivers.entries()) {
        const socket = io.sockets.sockets.get(socketId)
        if (socket) {
          socket.emit("driverNotification", notification)
          console.log(`Sent notification to driver ${driverId}`)
        }
      }
    },
  }
}

// Helper function to get status from trip status
const getStatusFromTripStatus = (tripStatus) => {
  const statusMap = {
    pickup: "AWAITING_PICKUP",
    delivering: "IN_TRANSIT",
    completed: "DELIVERED",
  }
  return statusMap[tripStatus] || tripStatus.toUpperCase()
}

// Helper function to get distance message
const getDistanceMessage = (driverLocation, tripDetails) => {
  // In a real app, you would calculate the actual distance
  // For now, we'll just return a generic message based on the trip status
  switch (tripDetails.status) {
    case "pickup":
      return "on the way to pickup location"
    case "delivering":
      return "on the way to delivery location"
    case "completed":
      return "has completed the delivery"
    default:
      return "on the move"
  }
}

// Helper function to get status message based on status
const getStatusMessage = (status) => {
  switch (status) {
    case "pickup":
      return "Driver is heading to pickup location"
    case "delivering":
      return "Package picked up, on the way to delivery"
    case "completed":
      return "Delivery completed"
    default:
      return `Status updated to ${status}`
  }
}

// Function to send order cancellation notification
const sendOrderCancellationNotification = async (
  userId,
  orderId,
  reason = "No drivers are available at the moment.",
) => {
  if (isKafkaEnabled && userId) {
    try {
      await createUserSpecificTopic(userId)

      await sendToUserTopic(userId, {
        id: `cancel-${orderId}-${Date.now()}`,
        title: "Order Cancelled",
        message: reason,
        notificationType: "error",
        eventType: "OrderStatusUpdated",
        data: {
          orderId: orderId,
          status: "CANCELLED",
          message: reason,
        },
        timestamp: new Date().toISOString(),
      })

      console.log(`Sent order cancellation notification to user ${userId}`)
      return true
    } catch (error) {
      console.error("Error sending cancellation notification:", error)
      return false
    }
  }
  return false
}

