import { Consumer, Kafka, logLevel, Partitioners, Producer } from "kafkajs";
import { MessageBrokerType, MessageHandler, PublishType } from "./broker.type";
import { MessageType, OrderEvent } from "../../types";
import { logger } from "../logger";

// Configuration Properties
const CLIENT_ID = process.env.CLIENT_ID || "order-service";
const GROUP_ID = process.env.GROUP_ID || "order-service-group";
const BROKERS = [process.env.BROKER_1 || "kafka-service:9092"];

const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: BROKERS,
  logLevel: logLevel.INFO,
});

let producer: Producer;
let consumer: Consumer;

const createTopic = async (topic: string[]) => {
  // topics which we want to create
  const topics = topic.map((t) => ({
    topic: t,
    numPartitions: 2,
    replicationFactor: 1,
  }));

  // create kafka admin
  const admin = kafka.admin();

  // connect to admin client
  await admin.connect();

  // get all the topics which are exist
  const topicExists = await admin.listTopics();

  logger.info(`Checking if topics exist: ${topics.map(t => t.topic).join(', ')}`);
  
  // check if topic is not exist then create it
  for (const t of topics) {
    if (!topicExists.includes(t.topic)) {
      logger.info(`Creating topic: ${t.topic}`);
      await admin.createTopics({ topics: [t] });
    } else {
      logger.info(`Topic already exists: ${t.topic}`);
    }
  }

  // disconnect from admin client
  await admin.disconnect();
};

// connect producer to kafka
const connectProducer = async <T>(): Promise<T> => {
  // first create topics on which we want to connect producer
  await createTopic(["OrderDeliveryRequests"]);

  // check if producer is already connected
  if (producer) {
    logger.info("Producer already connected with existing connection");
    return producer as unknown as T;
  }
  // if not

  // create producer with default partitioner
  producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
  });

  // connect producer to kafka
  await producer.connect();
  logger.info("Producer connected with a new connection");
  // return connected producer
  return producer as unknown as T;
};

// disconnect producer from kafka
const disconnectProducer = async (): Promise<void> => {
  // check if producer is already connected
  if (producer) {
    // just disconnect from producer
    await producer.disconnect();
  }
};

// publish message/event with producer to specified topic
const publish = async (data: PublishType): Promise<boolean> => {
  // create producer and if exist then just you will get that only
  const producer = await connectProducer<Producer>();

  // send message to kafka on specified topic and in return you will get the result which you send
  const result = await producer.send({
    topic: data.topic,
    messages: [
      {
        headers: data.headers,
        key: data.event,
        value: JSON.stringify(data.message),
      },
    ],
  });

  console.log("Message sent:", result);

  // check if message sent successfully
  return result.length > 0;
};

// connect consumer to kafka
const connectConsumer = async <T>(): Promise<T> => {
  // check if consumer is already connected
  if (consumer) {
    // if connected then just you will get that only
    return consumer as unknown as T;
  }

  // create consumer with default group id
  consumer = kafka.consumer({
    groupId: GROUP_ID,
  });

  // connect consumer to kafka
  await consumer.connect();

  // return connected consumer
  return consumer as unknown as T;
};

// disconnect consumer from kafka
const disconnectConsumer = async (): Promise<void> => {
  // check if consumer is already connected
  if (consumer) {
    // just disconnect from consumer
    await consumer.disconnect();
  }
};

// subscribe consumer to specified topic
const subscribe = async (messageHandler: MessageHandler, topic: string) => {
  // create consumer and if exist then just you will get that only
  const consumer = await connectConsumer<Consumer>();

  // subscribe consumer to specified topic from beginning of the topic  and run it indefinitely
  await consumer.subscribe({ topic: topic, fromBeginning: true });

  // on each message received, it will call the provided message handler
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      // Process messages from any of our topics
      if (topic !== "OrderDeliveryRequests") {
        return;
      }

      // check if message has headers and key and value
      if (message.key && message.value) {
        // parse message to MessageType and pass it to provided message handler  and then commit the offset
        const inputMessage: MessageType = {
          headers: message.headers,
          event: message.key.toString() as OrderEvent,
          data: message.value ? JSON.parse(message.value.toString()) : null,
        };

        // call provided message handler with parsed message
        await messageHandler(inputMessage);

        // commit the offset of the message that has been processed so that it won't be processed again
        await consumer.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);
      }
    },
  });
};

export const MessageBroker: MessageBrokerType = {
  // Producer
  connectProducer,
  disconnectProducer,
  publish,

  // Consumer
  connectConsumer,
  disconnectConsumer,
  subscribe,
};