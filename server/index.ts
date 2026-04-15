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
  getUserProgress,
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
  deactivateUserById,
} from './src/config/userController';
import {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  reactToMessage,
  acknowledgeMessage,
} from './src/config/messageController';
import { logClick, getClickAnalytics, getTimeOnPageAnalytics } from './src/config/clickController';
import { exportAnalyticsCSV } from './src/config/analyticsExportController';
import { forgotPassword, resetPassword } from './src/config/authController';
import { getCourseInteractionAnalytics } from './src/config/courseInteractionController';
import {
  getCalendarTasks,
  createCalendarTask,
  updateCalendarTask,
  deleteCalendarTask,
} from './src/config/calendarController';
import {
  createTask,
  readTask,
  updateTask,
  deleteTask,
} from './src/config/taskController';
import {
  getUserMessages,
  sendUserMessage,
  listConversations,
  getConversation,
  adminReply,
} from './src/config/directMessageController';

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
app.get('/api/courses/:courseId/progress', requireAuth, getUserProgress);
app.patch('/api/courses/:courseId/modules/:moduleIndex/complete', requireAuth, toggleModuleComplete);
app.get('/api/analytics/courses', getCourseAnalytics);
app.get('/api/admin/analytics/purchases', requireAuth, requireAdmin, getPurchaseAnalytics);
app.post('/api/analytics/click', logClick);
app.get('/api/admin/analytics/clicks', requireAuth, requireAdmin, getClickAnalytics);
app.get('/api/admin/analytics/courses', requireAuth, requireAdmin, getCourseInteractionAnalytics);
app.get('/api/admin/analytics/time-on-page', requireAuth, requireAdmin, getTimeOnPageAnalytics);
app.get('/api/admin/analytics/export/csv', requireAuth, requireAdmin, exportAnalyticsCSV);

// ── Messages (broadcast) ──────────────────────────────────────────────────────
app.get('/api/messages', getMessages);
app.post('/api/messages', createMessage);
app.post('/api/messages/:id/react', requireAuth, reactToMessage);
app.post('/api/messages/:id/acknowledge', requireAuth, acknowledgeMessage);
app.put('/api/messages/:id', updateMessage);
app.delete('/api/messages/:id', deleteMessage);

// ── Direct Messages (chat with Jordan) ───────────────────────────────────────
app.get('/api/chat/messages', requireAuth, getUserMessages);
app.post('/api/chat/messages', requireAuth, sendUserMessage);
app.get('/api/admin/chat', requireAuth, requireAdmin, listConversations);
app.get('/api/admin/chat/:userId', requireAuth, requireAdmin, getConversation);
app.post('/api/admin/chat/:userId', requireAuth, requireAdmin, adminReply);

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
app.post('/api/users/:id/deactivate', requireAuth, deactivateUserById);

// ── Checklist ────────────────────────────────────────────────────────────────
app.get('/api/checklist', requireAuth, readTask);
app.post('/api/checklist', requireAuth, createTask);
app.patch('/api/checklist/:id', requireAuth, updateTask);
app.delete('/api/checklist/:id', requireAuth, deleteTask);

// ── Calendar ──────────────────────────────────────────────────────────────────
app.get('/api/calendar/tasks', requireAuth, getCalendarTasks);
app.post('/api/calendar/tasks', requireAuth, createCalendarTask);
app.patch('/api/calendar/tasks/:id', requireAuth, updateCalendarTask);
app.delete('/api/calendar/tasks/:id', requireAuth, deleteCalendarTask);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
