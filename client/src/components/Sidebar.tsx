import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="logo-section">
        <span className="menu-icon">☰</span>
      </div>

      <nav className="nav-links">
        <Link to="/dashboard" className="nav-item">
          <div className="icon">🏠</div>
          <span>Home</span>
        </Link>

        <Link to="/courses" className="nav-item">
          <div className="icon">📂</div>
          <span>Courses</span>
        </Link>

        <Link to="/messages" className="nav-item">
          <div className="icon">✈️</div>
          <span>Messages</span>
        </Link>

        <Link to="/profile" className="nav-item">
          <div className="icon">👤</div>
          <span>You</span>
        </Link>

        <Link to="/admin/courses/create" className="nav-item">
          <div className="icon">➕</div>
          <span>Create Course</span>
        </Link>

        <Link to="/admin/docs" className="nav-item">
          <div className="icon">📄</div>
          <span>Upload Docs</span>
        </Link>

        <Link to="/admin/analytics" className="nav-item">
          <div className="icon">📊</div>
          <span>Analytics</span>
        </Link>

        <Link to="/account-settings" className="nav-item">
          <div className="icon">⚙️</div>
          <span>Account Settings</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
