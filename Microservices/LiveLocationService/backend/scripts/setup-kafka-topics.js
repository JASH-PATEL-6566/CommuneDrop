import { Kafka } from "kafkajs"

const kafka = new Kafka({
  clientId: "admin-client",
  brokers: ["localhost:9092"],
})

const admin = kafka.admin()

const run = async () => {
  await admin.connect()
  console.log("Admin connected")

  // Create topics
  await admin.createTopics({
    topics: [
      {
        topic: "driver-location-updates",
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: "retention.ms", value: "86400000" }, // 24 hours retention
        ],
      },
      {
        topic: "trip-status-updates",
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: "retention.ms", value: "86400000" }, // 24 hours retention
        ],
      },
    ],
  })

  console.log("Topics created successfully")
  await admin.disconnect()
}

run().catch(console.error)

