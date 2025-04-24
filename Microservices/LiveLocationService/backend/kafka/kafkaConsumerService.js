import { setupKafkaConsumer } from "./kafkaSetup.js"
import { processLocationUpdate } from "./locationConsumer.js"
import Trip from "../models/Trip.js"

const startKafkaConsumerService = async () => {
  const io = null
  const consumer = setupKafkaConsumer(io)
  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const messageValue = JSON.parse(message.value.toString())
        if (topic === "driver-location-updates") {
          const { tripId, location, timestamp } = messageValue
          console.log(`Consumer service: Received location update for trip ${tripId}`)
          await processLocationUpdate(tripId, location, timestamp)
          await Trip.findOneAndUpdate({ id: tripId }, { currentLocation: location, updatedAt: new Date() })
        } else if (topic === "trip-status-updates") {
          const { tripId, status, timestamp } = messageValue
          console.log(`Consumer service: Received status update for trip ${tripId}`)
          await Trip.findOneAndUpdate({ id: tripId }, { status, updatedAt: new Date() })
        }
      } catch (error) {
        console.error("Error processing Kafka message in consumer service:", error)
      }
    },
  })

  console.log("Kafka consumer service started")
}

if (require.main === module) {
  startKafkaConsumerService().catch(console.error)
}

export default startKafkaConsumerService

