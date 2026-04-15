import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Courses from './components/Courses';
import Profile from './components/Profile';
import CreateCourse from './components/CreateCourse';
import CourseDetail from './components/CourseDetail';
import AdminMessages from './components/AdminMessages';
import AdminUploadDocs from './components/AdminUploadDocs';
import AdminAnalytics from './components/AdminAnalytics';
import UserSettings from './components/UserSettings';
import AdminDirectory from './components/AdminDirectory';
import About from './components/About';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Calendar from './components/Calendar';
import ChatJordan from './components/ChatJordan';
import AdminChat from './components/AdminChat';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/courses/create" element={<AdminRoute><CreateCourse /></AdminRoute>} />
          <Route path="/admin/docs" element={<AdminRoute><AdminUploadDocs /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="/messages" element={<AdminMessages />} />
          <Route path="/about" element={<About />} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatJordan /></ProtectedRoute>} />
          <Route path="/admin/chat" element={<AdminRoute><AdminChat /></AdminRoute>} />
          <Route path="/account-settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminDirectory /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;