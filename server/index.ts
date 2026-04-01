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
  getPurchaseAnalytics,
} from './src/config/courseController';
import { requireAuth, requireAdmin } from './src/config/authMiddleware';
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
  reactToMessage,
  acknowledgeMessage,
} from './src/config/messageController';
import { logClick, getClickAnalytics } from './src/config/clickController';
import { forgotPassword, resetPassword } from './src/config/authController';
import { getCourseInteractionAnalytics } from './src/config/courseInteractionController';
import { getCalendarTasks } from './src/config/calendarController';
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
app.get('/api/admin/analytics/purchases', requireAuth, requireAdmin, getPurchaseAnalytics);
app.post('/api/analytics/click', logClick);
app.get('/api/admin/analytics/clicks', requireAuth, requireAdmin, getClickAnalytics);
app.get('/api/admin/analytics/courses', requireAuth, requireAdmin, getCourseInteractionAnalytics);

// ── Messages ─────────────────────────────────────────────────────────────────
app.get('/api/messages', getMessages);
app.post('/api/messages', createMessage);
app.post('/api/messages/:id/react', requireAuth, reactToMessage);
app.post('/api/messages/:id/acknowledge', requireAuth, acknowledgeMessage);
app.put('/api/messages/:id', updateMessage);
app.delete('/api/messages/:id', deleteMessage);

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginUser);
app.post('/api/auth/logout', logoutUser);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password/:token', resetPassword);

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

// ── Calendar ──────────────────────────────────────────────────────────────────
app.get('/api/calendar/tasks', requireAuth, getCalendarTasks);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});