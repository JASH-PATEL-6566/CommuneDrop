import { MessageBroker } from "../utils/broker" // Use the real Kafka implementation
import { logger } from "../utils"

export const InitializeBroker = async () => {
  try {
    // step 1: create the producer
    const producer = await MessageBroker.connectProducer()
    logger.info("Producer connected successfully!")

    // step 2: create the consumer
    const consumer = await MessageBroker.connectConsumer()
    logger.info("Consumer connected successfully!")

    // step 3: subscribe to the topics
    // Subscribe to OrderDeliveryRequests (if we want to listen to our own notifications)
    await MessageBroker.subscribe((message) => {
      logger.info(`Received message: ${JSON.stringify(message)}`)
    }, "OrderDeliveryRequests")

    logger.info("Broker initialization completed")
  } catch (error) {
    logger.error(`Error initializing broker: ${error.message}`)
    throw error
  }
}

