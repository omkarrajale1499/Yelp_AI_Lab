import asyncio
import json
import os
from aiokafka import AIOKafkaConsumer
from motor.motor_asyncio import AsyncIOMotorClient

# Fallback to docker service names if env vars are missing
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb:27017")

# Initialize MongoDB Client
mongo_client = AsyncIOMotorClient(MONGO_URL)
mongo_db = mongo_client.yelp_database

# We will import the updated consumer functions here
from .consumers import (
    process_review_created, 
    process_review_updated, 
    process_review_deleted,
    process_restaurant_created
)

async def consume():
    # Subscribing to all topics mentioned in the assignment matrix
    consumer = AIOKafkaConsumer(
        'review.created', 'review.updated', 'review.deleted', 'restaurant.created',
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="master_worker_group",
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    
    # Retry logic with backoff for Kafka startup
    retries = 5
    for i in range(retries):
        try:
            print(f"Attempting to start Worker Consumer (Attempt {i+1}/{retries})...")
            await consumer.start()
            print("Worker successfully connected to Kafka and listening!")
            break
        except Exception as e:
            print(f"Worker failed to connect to Kafka: {e}")
            if i < retries - 1:
                await asyncio.sleep(5) # Wait 5 seconds before retrying
            else:
                print("Worker Max retries reached. Exiting.")
                return # Exit the function if we can't connect
    
    try:
        async for msg in consumer:
            print(f"Received message on topic {msg.topic}: {msg.value['request_id']}")
            
            # Pass ONLY the mongo_db connection to the processors
            if msg.topic == 'review.created':
                await process_review_created(msg.value, mongo_db)
            elif msg.topic == 'review.updated':
                await process_review_updated(msg.value, mongo_db)
            elif msg.topic == 'review.deleted':
                await process_review_deleted(msg.value, mongo_db)
            elif msg.topic == 'restaurant.created':
                await process_restaurant_created(msg.value, mongo_db)
    finally:
        await consumer.stop()

if __name__ == "__main__":
    asyncio.run(consume())