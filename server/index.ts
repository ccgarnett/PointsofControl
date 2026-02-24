import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db';
import {
  getCourses,
  createCourse,
  deleteCourse,
  uploadDocMiddleware,
  uploadDoc,
  toggleModuleComplete,
  getCourseAnalytics,
} from './src/config/courseController';
import {
  registerUser,
  getProfile,
  updateProfile,
  uploadPicture,
  uploadProfilePicture,
} from './src/config/userController';
import {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from './src/config/messageController';
import { getCourses, createCourse } from './src/config/courseController';
import { registerUser, getProfile, updateProfile, uploadPicture, uploadProfilePicture } from './src/config/userController';

connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Courses ──────────────────────────────────────────────────────────────────
app.get('/api/courses', getCourses);
app.post('/api/courses', createCourse);
app.delete('/api/courses/:id', deleteCourse);
app.post('/api/courses/:id/docs', uploadDocMiddleware, uploadDoc);
app.patch('/api/courses/:courseId/modules/:moduleIndex/complete', toggleModuleComplete);
app.get('/api/analytics/courses', getCourseAnalytics);

// ── Messages ─────────────────────────────────────────────────────────────────
app.get('/api/messages', getMessages);
app.post('/api/messages', createMessage);
app.put('/api/messages/:id', updateMessage);
app.delete('/api/messages/:id', deleteMessage);

// ── Users ────────────────────────────────────────────────────────────────────
app.post('/api/users/register', registerUser);
app.get('/api/users/profile', getProfile);
app.put('/api/users/profile', updateProfile);
app.post('/api/users/profile/picture', uploadProfilePicture, uploadPicture);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});