import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'ws-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

export const producer = kafka.producer();

export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected in WS Service');
  } catch (error) {
    console.error('Error connecting Kafka producer', error);
  }
};
