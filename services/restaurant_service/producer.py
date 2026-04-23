import asyncio
from aiokafka import AIOKafkaProducer
import json
import os

producer: AIOKafkaProducer = None
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

async def get_producer():
    global producer
    if not producer:
        producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
        # Retry logic with backoff
        retries = 5
        for i in range(retries):
            try:
                print(f"Attempting to connect to Kafka (Attempt {i+1}/{retries})...")
                await producer.start()
                print("Successfully connected to Kafka!")
                break
            except Exception as e:
                print(f"Failed to connect to Kafka: {e}")
                if i < retries - 1:
                    await asyncio.sleep(5) # Wait 5 seconds before retrying
                else:
                    print("Max retries reached. Could not connect to Kafka.")
                    raise
    return producer

async def send_event(topic: str, message: dict):
    prod = await get_producer()
    await prod.send_and_wait(topic, message)