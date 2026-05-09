import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectProducer, producer } from './kafka';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, restrict this
    methods: ['GET', 'POST'],
  },
});

const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

// Basic health check route
app.get('/health', (req: Request, res: Response) => res.send('WS Service is healthy'));

const start = async () => {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  
  await connectProducer();

  // Middleware for Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.userId}`);
    
    // Join a room for user-specific events
    socket.join(user.userId);

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${user.userId} joined conversation ${conversationId}`);
    });

    socket.on('send_message', async (data: { conversationId: string; content: string }) => {
      const { conversationId, content } = data;
      
      const messagePayload = {
        senderId: user.userId,
        conversationId,
        content,
        createdAt: new Date().toISOString()
      };

      // Broadcast to the conversation room immediately
      io.to(conversationId).emit('new_message', messagePayload);

      // Publish to Kafka for persistence in Chat Service
      await producer.send({
        topic: 'chat.messages',
        messages: [{ value: JSON.stringify(messagePayload) }],
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.userId}`);
    });
  });

  const PORT = process.env.PORT || 4003;
  httpServer.listen(PORT, () => {
    console.log(`WS Service listening on port ${PORT}`);
  });
};

start();
