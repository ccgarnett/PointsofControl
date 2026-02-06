import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db';
import { getCourses } from './courseController';

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/courses', getCourses);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
