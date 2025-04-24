import { MessageBrokerType, MessageHandler, PublishType } from "./broker.type";
import { MessageType, OrderEvent } from "../../types";
import { logger } from "../logger";

/**
 * Mock implementation of MessageBroker for development and testing
 * Simulates Kafka behavior without requiring an actual Kafka instance
 */
class MockMessageBrokerImpl implements MessageBrokerType {
  private handlers: Map<string, MessageHandler[]> = new Map();
  private connected: boolean = false;

  // Simulated producer connection
  async connectProducer<T>(): Promise<T> {
    logger.info("Mock producer connected");
    this.connected = true;
    return {} as unknown as T;
  }

  // Simulated producer disconnection
  async disconnectProducer(): Promise<void> {
    logger.info("Mock producer disconnected");
    this.connected = false;
  }

  // Simulated message publishing
  async publish(data: PublishType): Promise<boolean> {
    if (!this.connected) {
      logger.warn("Cannot publish message - producer not connected");
      return false;
    }

    logger.info(`[MOCK] Publishing to ${data.topic}: ${JSON.stringify(data.message)}`);

    // Simulate message delivery to local handlers
    const handlers = this.handlers.get(data.topic) || [];
    
    // Format the message according to our MessageType interface
    const message: MessageType = {
      headers: data.headers,
      event: data.event,
      data: data.message
    };

    // Process message with all registered handlers for this topic
    handlers.forEach(handler => {
      try {
        // Execute handler asynchronously to simulate Kafka behavior
        setTimeout(() => {
          handler(message);
        }, 10);
      } catch (error) {
        logger.error(`Error in mock message handler: ${error.message}`);
      }
    });

    return true;
  }

  // Simulated consumer connection
  async connectConsumer<T>(): Promise<T> {
    logger.info("Mock consumer connected");
    return {} as unknown as T;
  }

  // Simulated consumer disconnection
  async disconnectConsumer(): Promise<void> {
    logger.info("Mock consumer disconnected");
  }

  // Register a handler for a topic
  async subscribe(messageHandler: MessageHandler, topic: string): Promise<void> {
    logger.info(`[MOCK] Subscribing to ${topic}`);
    
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    
    this.handlers.get(topic)?.push(messageHandler);
    
    // Log all the topics we're now subscribed to
    logger.info(`[MOCK] Currently subscribed topics: ${[...this.handlers.keys()].join(', ')}`);
  }
}

// Export a singleton instance
export const MockMessageBroker: MessageBrokerType = new MockMessageBrokerImpl();