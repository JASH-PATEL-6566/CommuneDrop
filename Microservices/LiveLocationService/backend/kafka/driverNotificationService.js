import { Kafka } from "kafkajs"
import Trip from "../models/Trip.js"
import LocationUpdate from "../models/LocationUpdate.js"

// Kafka configuration
const kafka = new Kafka({
  clientId: "driver-notification-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  connectionTimeout: 10000,
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
})

const consumer = kafka.consumer({ groupId: "driver-notification-group" })
const producer = kafka.producer()

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} point1 - First point with lat and lng properties
 * @param {Object} point2 - Second point with lat and lng properties
 * @returns {Number} Distance in kilometers
 */
const calculateDistance = (point1, point2) => {
  const R = 6371 // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180)
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

/**
 * Find all drivers within a certain distance of a location
 * @param {Object} location - Location with lat and lng properties
 * @param {Number} maxDistance - Maximum distance in kilometers
 * @returns {Promise<Array>} - Array of nearby driver IDs
 */
const findNearbyDrivers = async (location, maxDistance = 5) => {
  try {
    // Get the most recent location for each driver from LocationUpdate collection
    const latestDriverLocations = await LocationUpdate.aggregate([
      {
        $sort: { timestamp: -1 }, // Sort by timestamp descending (newest first)
      },
      {
        $group: {
          _id: "$tripId",
          location: { $first: "$location" },
          timestamp: { $first: "$timestamp" },
        },
      },
      {
        $project: {
          tripId: "$_id",
          location: 1,
          timestamp: 1,
          _id: 0,
        },
      },
    ])

    // Filter for drivers within the maxDistance
    const nearbyDrivers = []
    for (const driverLocation of latestDriverLocations) {
      const distance = calculateDistance(location, driverLocation.location)
      if (distance <= maxDistance) {
        // Get the Trip to find the driverId
        const trip = await Trip.findOne({ id: driverLocation.tripId })
        if (trip && trip.driverId) {
          nearbyDrivers.push({
            driverId: trip.driverId,
            tripId: driverLocation.tripId,
            distance: distance.toFixed(2),
            location: driverLocation.location,
          })
        }
      }
    }

    return nearbyDrivers
  } catch (error) {
    console.error("Error finding nearby drivers:", error)
    return []
  }
}

/**
 * Create a new Kafka topic for a specific user
 * @param {String} userId - User ID to create topic for
 * @returns {Promise<Boolean>} - Whether topic was created successfully
 */
export const createUserSpecificTopic = async (userId) => {
  try {
    const admin = kafka.admin()
    await admin.connect()

    // Format the topic name with the user UUID
    const topicName = `user-updates-${userId}`

    // Check if topic already exists
    const topics = await admin.listTopics()
    if (topics.includes(topicName)) {
      console.log(`Topic ${topicName} already exists`)
      await admin.disconnect()
      return true
    }

    // Create the topic
    await admin.createTopics({
      topics: [
        {
          topic: topicName,
          numPartitions: 1,
          replicationFactor: 1,
          configEntries: [
            { name: "retention.ms", value: "86400000" }, // 24 hours retention
          ],
        },
      ],
    })

    console.log(`Created user-specific topic: ${topicName}`)
    await admin.disconnect()
    return true
  } catch (error) {
    console.error(`Error creating user-specific topic for user ${userId}:`, error)
    return false
  }
}

// Update the sendToUserTopic function to match the exact event format provided
export const sendToUserTopic = async (userId, event) => {
  try {
    if (!producer.isConnected) {
      await producer.connect()
    }

    // Format the topic name with the user UUID
    const topicName = `user-updates-${userId}`

    // Ensure the event has the required structure
    const formattedEvent = {
      eventType: event.eventType,
      orderId: event.orderId,
      timestamp: event.timestamp || Date.now(),
      data: event.data || {},
    }

    await producer.send({
      topic: topicName,
      messages: [
        {
          key: event.orderId || userId,
          value: JSON.stringify(formattedEvent),
        },
      ],
    })

    console.log(`Sent event to user topic ${topicName}:`, formattedEvent)
    return true
  } catch (error) {
    console.error(`Error sending event to user topic for user ${userId}:`, error)
    return false
  }
}

/**
 * Parse address to get approximate coordinates
 * This is a simplified version - in production, you would use a geocoding service
 * @param {String} address - Address to parse
 * @returns {Object} - Location with lat and lng properties
 */
const parseAddressToCoordinates = (address) => {
  // For this example, we'll return Halifax coordinates
  // In a real app, you would use Google Maps Geocoding API or similar
  return {
    lat: 44.6476,
    lng: -63.5728,
  }
}

/**
 * Start the Kafka consumer to listen for payment notifications
 * @param {Socket} io - Socket.io instance to emit notifications to drivers
 */
export const startDriverNotificationConsumer = async (io) => {
  try {
    await consumer.connect()
    await producer.connect()
    console.log("Driver notification consumer connected to Kafka")

    await consumer.subscribe({ topic: "OrderDeliveryRequests", fromBeginning: false })
    console.log("Subscribed to OrderDeliveryRequests topic")

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = JSON.parse(message.value.toString())
          console.log("Received notification:", messageValue)

          // Check if this is a payment received notification
          if (messageValue.status === "PAYMENT_RECEIVED") {
            console.log("Processing payment received notification for order:", messageValue.orderId)

            // Extract all relevant data from the message
            const { orderId, userId, from_address, to_address, amount, timestamp, status } = messageValue

            // Parse addresses to get coordinates
            const pickupLocation = parseAddressToCoordinates(from_address)
            const dropoffLocation = parseAddressToCoordinates(to_address)

            // Find nearby drivers
            const nearbyDrivers = await findNearbyDrivers(pickupLocation, 10) // 10km radius
            console.log(`Found ${nearbyDrivers.length} drivers within 10km of the pickup location`)

            if (nearbyDrivers.length > 0) {
              // Send notification to each nearby driver via Socket.io
              nearbyDrivers.forEach((driver) => {
                // Check if the driver is connected to Socket.io
                const driverRoom = `driver:${driver.driverId}`
                if (io.sockets.adapter.rooms.has(driverRoom)) {
                  console.log(`Sending notification to driver ${driver.driverId}`)

                  // Create proper location objects with coordinates
                  const pickupLocationCoords = {
                    lat: Number.parseFloat(pickupLocation.lat) || 44.643,
                    lng: Number.parseFloat(pickupLocation.lng) || -63.5793,
                    address: from_address,
                  }

                  const dropoffLocationCoords = {
                    lat: Number.parseFloat(dropoffLocation.lat) || 44.6418,
                    lng: Number.parseFloat(dropoffLocation.lng) || -63.5784,
                    address: to_address,
                  }

                  io.to(driverRoom).emit("driverNotification", {
                    type: "delivery_request",
                    data: {
                      orderId,
                      userId,
                      from_address,
                      to_address,
                      amount,
                      distance: driver.distance,
                      status,
                      timestamp,
                      pickupLocation: pickupLocationCoords,
                      dropoffLocation: dropoffLocationCoords,
                    },
                    timestamp: new Date().toISOString(),
                  })
                } else {
                  // Broadcast to all drivers if specific room not found
                  // Create proper location objects with coordinates
                  const pickupLocationCoords = {
                    lat: Number.parseFloat(pickupLocation.lat) || 44.643,
                    lng: Number.parseFloat(pickupLocation.lng) || -63.5793,
                    address: from_address,
                  }

                  const dropoffLocationCoords = {
                    lat: Number.parseFloat(dropoffLocation.lat) || 44.6418,
                    lng: Number.parseFloat(dropoffLocation.lng) || -63.5784,
                    address: to_address,
                  }

                  io.emit("driverNotification", {
                    type: "delivery_request",
                    data: {
                      orderId,
                      userId,
                      from_address,
                      to_address,
                      amount,
                      distance: driver.distance,
                      status,
                      timestamp,
                      pickupLocation: pickupLocationCoords,
                      dropoffLocation: dropoffLocationCoords,
                    },
                    timestamp: new Date().toISOString(),
                  })
                  console.log(`Driver ${driver.driverId} is not connected to Socket.io, broadcasting to all`)
                }
              })
            } else {
              // If no nearby drivers, broadcast to all drivers
              console.log("No nearby drivers found, broadcasting to all drivers")

              // Create proper location objects with coordinates
              const pickupLocationCoords = {
                lat: Number.parseFloat(pickupLocation.lat) || 44.643,
                lng: Number.parseFloat(pickupLocation.lng) || -63.5793,
                address: from_address,
              }

              const dropoffLocationCoords = {
                lat: Number.parseFloat(dropoffLocation.lat) || 44.6418,
                lng: Number.parseFloat(dropoffLocation.lng) || -63.5784,
                address: to_address,
              }

              io.emit("driverNotification", {
                type: "delivery_request",
                data: {
                  orderId,
                  userId,
                  from_address,
                  to_address,
                  amount,
                  status,
                  timestamp,
                  pickupLocation: pickupLocationCoords,
                  dropoffLocation: dropoffLocationCoords,
                },
                timestamp: new Date().toISOString(),
              })
            }
          }
        } catch (error) {
          console.error("Error processing notification message:", error)
        }
      },
    })

    console.log("Driver notification consumer is running")
  } catch (error) {
    console.error("Failed to start driver notification consumer:", error)
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  try {
    await consumer.disconnect()
    await producer.disconnect()
    console.log("Driver notification consumer disconnected")
    process.exit(0)
  } catch (error) {
    console.error("Error during shutdown:", error)
    process.exit(1)
  }
})

