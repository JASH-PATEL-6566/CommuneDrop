import { Kafka } from "kafkajs"

// Simple script to test Kafka connection
const testKafkaConnection = async () => {
  console.log("Testing Kafka connection...")

  const kafka = new Kafka({
    clientId: "kafka-test-client",
    brokers: ["localhost:9092"],
    connectionTimeout: 10000,
  })

  const admin = kafka.admin()

  try {
    console.log("Connecting to Kafka admin...")
    await admin.connect()
    console.log("Successfully connected to Kafka!")

    console.log("Listing topics...")
    const topics = await admin.listTopics()
    console.log("Available topics:", topics)

    await admin.disconnect()
    console.log("Kafka connection test completed successfully")
  } catch (error) {
    console.error("Failed to connect to Kafka:", error)
  }
}

testKafkaConnection().catch(console.error)

