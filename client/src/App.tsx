import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import CreateCourse from './components/CreateCourse';
import CourseDetail from './components/CourseDetail';

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
        <Route path="/messages" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
