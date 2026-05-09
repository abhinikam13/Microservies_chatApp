import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import { createConversation, getConversations, getMessages, getUsers } from './controllers/chat';
import { startConsumer } from './kafka';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat/conversations', createConversation);
app.get('/api/chat/conversations/:userId', getConversations);
app.get('/api/chat/messages/:conversationId', getMessages);
app.get('/api/chat/users', getUsers);

const PORT = process.env.PORT || 4002;

const start = async () => {
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`Chat Service listening on port ${PORT}`);
  });
};

start();
