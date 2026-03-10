import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import CreateCourse from './components/CreateCourse';
import CourseDetail from './components/CourseDetail';
import AdminMessages from './components/AdminMessages';
import AdminUploadDocs from './components/AdminUploadDocs';
import AdminAnalytics from './components/AdminAnalytics';
import AccountSettings from './components/AccountSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Dashboard />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/courses/create" element={<CreateCourse />} />
        <Route path="/admin/docs" element={<AdminUploadDocs />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/messages" element={<AdminMessages />} />
        <Route path="/account-settings" element={<AccountSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;