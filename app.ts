import express from 'express';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import { connectToDB } from './config/database';

const app = express();
app.use(express.json());

connectToDB();

app.use(userRoutes);
app.use(authRoutes);
app.use(ticketRoutes);

export default app;

