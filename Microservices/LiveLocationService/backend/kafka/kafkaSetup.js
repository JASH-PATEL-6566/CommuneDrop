import { Kafka } from "kafkajs"
import { processLocationUpdate } from "./locationConsumer.js"
import dotenv from "dotenv"
import { handleSocketConnections } from "../socket/socket.js"
import mongoose from "mongoose"

dotenv.config()

const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : ["localhost:9092"]
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "location-tracking-service"
const LOCATION_UPDATES_TOPIC = "driver-location-updates"
const TRIP_STATUS_TOPIC = "trip-status-updates"
const PAYMENT_NOTIFICATIONS_TOPIC = "payment-notifications"
const ORDER_DELIVERY_REQUESTS_TOPIC = "OrderDeliveryRequests"

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  connectionTimeout: 10000,
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
})

export const setupKafkaProducer = () => {
  const producer = kafka.producer()
  const connect = async () => {
    try {
      await producer.connect()
      console.log("Kafka producer connected successfully")
      const admin = kafka.admin()
      await admin.connect()
      const existingTopics = await admin.listTopics()
      const topicsToCreate = []
      if (!existingTopics.includes(LOCATION_UPDATES_TOPIC)) {
        topicsToCreate.push({
          topic: LOCATION_UPDATES_TOPIC,
          numPartitions: 3,
          replicationFactor: 1,
        })
      }
      if (!existingTopics.includes(TRIP_STATUS_TOPIC)) {
        topicsToCreate.push({
          topic: TRIP_STATUS_TOPIC,
          numPartitions: 3,
          replicationFactor: 1,
        })
      }
      if (!existingTopics.includes(PAYMENT_NOTIFICATIONS_TOPIC)) {
        topicsToCreate.push({
          topic: PAYMENT_NOTIFICATIONS_TOPIC,
          numPartitions: 3,
          replicationFactor: 1,
        })
      }
      if (!existingTopics.includes(ORDER_DELIVERY_REQUESTS_TOPIC)) {
        topicsToCreate.push({
          topic: ORDER_DELIVERY_REQUESTS_TOPIC,
          numPartitions: 3,
          replicationFactor: 1,
        })
      }
      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate,
          waitForLeaders: true,
        })
        console.log("Kafka topics created successfully")
      }
      await admin.disconnect()
    } catch (error) {
      console.error("Failed to connect Kafka producer:", error)
      setTimeout(connect, 5000)
    }
  }

  connect()

  const sendLocationUpdate = async (tripId, location) => {
    try {
      if (!producer || !producer.isConnected) {
        console.warn("Kafka producer not connected, reconnecting...")
        await connect()
      }
      await producer.send({
        topic: LOCATION_UPDATES_TOPIC,
        messages: [
          {
            key: tripId,
            value: JSON.stringify({
              tripId,
              location,
              timestamp: Date.now(),
            }),
          },
        ],
      })
      console.log(`Location update for trip ${tripId} sent to Kafka`)
      return true
    } catch (error) {
      console.error("Error sending location update to Kafka:", error)
      return false
    }
  }

  const sendTripStatusUpdate = async (tripId, status) => {
    try {
      if (!producer || !producer.isConnected) {
        console.warn("Kafka producer not connected, reconnecting...")
        await connect()
      }
      await producer.send({
        topic: TRIP_STATUS_TOPIC,
        messages: [
          {
            key: tripId,
            value: JSON.stringify({
              tripId,
              status,
              timestamp: Date.now(),
            }),
          },
        ],
      })
      console.log(`Status update for trip ${tripId} sent to Kafka`)
      return true
    } catch (error) {
      console.error("Error sending status update to Kafka:", error)
      return false
    }
  }

  // New function to send updates to user-specific topics
  const sendToUserTopic = async (userId, message) => {
    try {
      if (!producer || !producer.isConnected) {
        console.warn("Kafka producer not connected, reconnecting...")
        await connect()
      }

      const topicName = `user-updates-${userId}`

      await producer.send({
        topic: topicName,
        messages: [
          {
            key: message.tripId || userId,
            value: JSON.stringify(message),
          },
        ],
      })

      console.log(`Message sent to user topic ${topicName}:`, message)
      return true
    } catch (error) {
      console.error(`Error sending message to user topic for user ${userId}:`, error)
      return false
    }
  }

  return {
    sendLocationUpdate,
    sendTripStatusUpdate,
    sendToUserTopic,
    isConnected: () => producer && producer.isConnected,
  }
}

// Update the setupKafkaConsumer function to handle the specific event formats
export const setupKafkaConsumer = (io) => {
  const consumer = kafka.consumer({ groupId: "location-tracking-group" })
  let socketHandler = null
  if (io && io.sockets) {
    socketHandler = handleSocketConnections(io)
  }
  const connect = async () => {
    try {
      await consumer.connect()
      console.log("Kafka consumer connected successfully")
      await consumer.subscribe({
        topics: [LOCATION_UPDATES_TOPIC, TRIP_STATUS_TOPIC, PAYMENT_NOTIFICATIONS_TOPIC, ORDER_DELIVERY_REQUESTS_TOPIC],
        fromBeginning: false,
      })
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = JSON.parse(message.value.toString())
            if (topic === LOCATION_UPDATES_TOPIC) {
              const { tripId, location, timestamp } = messageValue
              console.log(`Received location update for trip ${tripId} from Kafka:`, location)
              await processLocationUpdate(tripId, location, timestamp)
              if (io) {
                io.to(`trip:${tripId}`).emit("driverLocationUpdate", {
                  tripId,
                  location,
                  timestamp,
                  source: "kafka",
                })

                // Try to find the trip to get the customer ID
                try {
                  const Trip = mongoose.model("Trip")
                  const tripDetails = await Trip.findOne({ id: tripId })

                  if (tripDetails && tripDetails.customerId) {
                    const orderId = tripDetails.packageDetails.replace("Order #", "")

                    // Format the event for the user-specific topic
                    const locationEvent = {
                      eventType: "DriverLiveLocation",
                      orderId: orderId,
                      timestamp: timestamp || Date.now(),
                      data: {
                        message: "Driver location updated",
                        location: {
                          lat: location.lat,
                          lng: location.lng,
                          heading: 180, // Default heading
                          speed: 35, // Default speed
                        },
                      },
                    }

                    // Send to user-specific topic
                    const userTopicProducer = setupKafkaProducer()
                    if (userTopicProducer && userTopicProducer.sendToUserTopic) {
                      await userTopicProducer.sendToUserTopic(tripDetails.customerId, locationEvent)
                    }
                  }
                } catch (error) {
                  console.error("Error forwarding location update to user topic:", error)
                }
              }
            } else if (topic === TRIP_STATUS_TOPIC) {
              const { tripId, status, timestamp } = messageValue
              console.log(`Received status update for trip ${tripId} from Kafka:`, status)
              if (io) {
                io.to(`trip:${tripId}`).emit("tripStatusUpdate", {
                  tripId,
                  status,
                  timestamp,
                  source: "kafka",
                })

                // Try to find the trip to get the customer ID
                try {
                  const Trip = mongoose.model("Trip")
                  const tripDetails = await Trip.findOne({ id: tripId })

                  if (tripDetails && tripDetails.customerId) {
                    const orderId = tripDetails.packageDetails.replace("Order #", "")

                    // Map internal status to user-facing status
                    const statusMap = {
                      pickup: "AWAITING_PICKUP",
                      delivering: "IN_TRANSIT",
                      completed: "DELIVERED",
                    }

                    const userStatus = statusMap[status] || status.toUpperCase()

                    // Format the event for the user-specific topic
                    const statusEvent = {
                      eventType: "OrderStatusUpdated",
                      orderId: orderId,
                      timestamp: timestamp || Date.now(),
                      data: {
                        status: userStatus,
                        estimatedArrival: status === "completed" ? "Delivered" : "10 minutes",
                        message: getStatusMessage(status),
                      },
                    }

                    // Send to user-specific topic
                    const userTopicProducer = setupKafkaProducer()
                    if (userTopicProducer && userTopicProducer.sendToUserTopic) {
                      await userTopicProducer.sendToUserTopic(tripDetails.customerId, statusEvent)
                    }
                  }
                } catch (error) {
                  console.error("Error forwarding status update to user topic:", error)
                }
              }
            } else if (topic === PAYMENT_NOTIFICATIONS_TOPIC) {
              console.log("Received payment notification:", messageValue)
              if (socketHandler) {
                socketHandler.broadcastToDrivers({
                  type: "payment",
                  data: messageValue,
                  timestamp: new Date().toISOString(),
                })
              } else if (io) {
                io.emit("driverNotification", {
                  type: "payment",
                  data: messageValue,
                  timestamp: new Date().toISOString(),
                })
              }
            } else if (topic === ORDER_DELIVERY_REQUESTS_TOPIC) {
              console.log("Received order delivery request:", messageValue)

              // Format the order delivery request for driver notification
              const orderRequest = {
                type: "delivery_request",
                data: messageValue,
                timestamp: new Date().toISOString(),
              }

              if (socketHandler) {
                socketHandler.broadcastToDrivers(orderRequest)
              } else if (io) {
                io.emit("driverNotification", orderRequest)
              }
            }
          } catch (error) {
            console.error("Error processing Kafka message:", error)
          }
        },
      })
    } catch (error) {
      console.error("Failed to connect Kafka consumer:", error)
      setTimeout(connect, 5000)
    }
  }

  connect()

  return consumer
}

// Helper function to get status message based on status
const getStatusMessage = (status) => {
  switch (status) {
    case "pickup":
      return "Driver is heading to pickup location"
    case "delivering":
      return "Your order is now in transit"
    case "completed":
      return "Your order has been delivered"
    default:
      return `Order status updated to ${status}`
  }
}

