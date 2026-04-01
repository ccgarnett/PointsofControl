import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadDocMiddleware,
  uploadDoc,
  toggleModuleComplete,
  getCourseAnalytics,
} from './src/config/courseController';
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  uploadPicture,
  uploadProfilePicture,
  listUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from './src/config/userController';
import {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from './src/config/messageController';
connectDB();
import {
  createTask,
  readTask,
  updateTask,
  deleteTask,
} from './src/config/taskController';
import { requireAuth } from './src/config/authMiddleware';
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Courses ──────────────────────────────────────────────────────────────────
app.get('/api/courses', getCourses);
app.post('/api/courses', createCourse);
app.put('/api/courses/:id', updateCourse);
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
app.post('/api/users/login', loginUser);
app.post('/api/users/logout', logoutUser);
app.get('/api/users/profile', getProfile);
app.put('/api/users/profile', updateProfile);
app.post('/api/users/profile', updateProfile);
app.post('/api/users/profile/picture', uploadProfilePicture, uploadPicture);
app.get('/api/users', listUsers);
app.get('/api/users/:id', getUserById);
app.put('/api/users/:id', updateUserById);
app.delete('/api/users/:id', deleteUserById);

// ── Checklist ──────────────────────────────────────────────────────────────────── 
app.get('/api/checklist', requireAuth, readTask);
app.post('/api/checklist', requireAuth, createTask);
app.patch('/api/checklist/:id', requireAuth, updateTask);
app.delete('/api/checklist/:id', requireAuth, deleteTask);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});