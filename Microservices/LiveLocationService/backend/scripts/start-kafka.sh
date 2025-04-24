#!/bin/bash

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down

# Start Kafka and Zookeeper
echo "Starting Kafka and Zookeeper..."
docker-compose up -d zookeeper kafka

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 10

# Test Kafka connection
echo "Testing Kafka connection..."
node scripts/kafka-test.js

echo "Setup complete!"

