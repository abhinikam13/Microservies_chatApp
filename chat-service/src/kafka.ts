import { Kafka } from 'kafkajs';
import { prisma } from './prisma';

const kafka = new Kafka({
  clientId: 'chat-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'chat-group' });

export const startConsumer = async () => {
  await consumer.connect();
  console.log('Kafka Consumer connected in Chat Service');

  await consumer.subscribe({ topic: 'user.created', fromBeginning: true });
  await consumer.subscribe({ topic: 'chat.messages', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;
      
      try {
        const payload = JSON.parse(message.value.toString());
        
        if (topic === 'user.created') {
          await prisma.user.create({
            data: {
              id: payload.id,
              email: payload.email,
              name: payload.name,
              createdAt: new Date(payload.createdAt),
            }
          });
          console.log(`Synced user: ${payload.id}`);
        } else if (topic === 'chat.messages') {
          await prisma.message.create({
            data: {
              content: payload.content,
              senderId: payload.senderId,
              conversationId: payload.conversationId,
              createdAt: new Date(payload.createdAt),
            }
          });
          console.log(`Saved message in conversation: ${payload.conversationId}`);
        }
      } catch (err) {
        console.error('Error processing Kafka message:', err);
      }
    },
  });
};
