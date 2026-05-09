import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import { register, login } from './controllers/auth';
import { connectProducer } from './kafka';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

const PORT = process.env.PORT || 4001;

const start = async () => {
  await connectProducer();
  app.listen(PORT, () => {
    console.log(`Auth Service listening on port ${PORT}`);
  });
};

start();
