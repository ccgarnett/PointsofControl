import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="logo-section">
        <button className="menu-icon" onClick={() => setCollapsed(!collapsed)}>☰</button>
      </div>

      <nav className="nav-links">
        <Link to="/dashboard" className={`nav-item${location.pathname === '/dashboard' ? ' active' : ''}`}>
          <div className="icon">🏠</div>
          <span>Home</span>
        </Link>

        <Link to="/courses" className={`nav-item${location.pathname.startsWith('/courses') ? ' active' : ''}`}>
          <div className="icon">📂</div>
          <span>Courses</span>
        </Link>

        <Link to="/messages" className={`nav-item${location.pathname === '/messages' ? ' active' : ''}`}>
          <div className="icon">✈️</div>
          <span>Messages</span>
        </Link>

        <Link to="/profile" className={`nav-item${location.pathname === '/profile' ? ' active' : ''}`}>
          <div className="icon">👤</div>
          <span>You</span>
        </Link>

        <Link to="/calendar" className={`nav-item${location.pathname === '/calendar' ? ' active' : ''}`}>
          <div className="icon">📅</div>
          <span>Calendar</span>
        </Link>

        {isAdmin && (
          <>
            <Link to="/admin/courses/create" className={`nav-item${location.pathname === '/admin/courses/create' ? ' active' : ''}`}>
              <div className="icon">➕</div>
              <span>Create Course</span>
            </Link>

            <Link to="/admin/docs" className={`nav-item${location.pathname === '/admin/docs' ? ' active' : ''}`}>
              <div className="icon">📄</div>
              <span>Upload Docs</span>
            </Link>

            <Link to="/admin/analytics" className={`nav-item${location.pathname === '/admin/analytics' ? ' active' : ''}`}>
              <div className="icon">📊</div>
              <span>Analytics</span>
            </Link>

            <Link to="/admin/users" className={`nav-item${location.pathname === '/admin/users' ? ' active' : ''}`}>
              <div className="icon">👥</div>
              <span>User Management</span>
            </Link>
          </>
        )}

        <Link to="/account-settings" className={`nav-item${location.pathname === '/account-settings' ? ' active' : ''}`}>
          <div className="icon">⚙️</div>
          <span>Account Settings</span>
        </Link>

        <Link to="/about" className={`nav-item${location.pathname === '/about' ? ' active' : ''}`}>
          <div className="icon">💡</div>
          <span>About</span>
        </Link>
      </nav>

      <div className="sidebar-bottom">
        {user ? (
          <>
            <div className="sidebar-username">{user.username}</div>
            <button className="nav-item logout-btn" onClick={handleLogout}>
              <div className="icon">🚪</div>
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-item login-btn">
              <div className="icon">🔑</div>
              <span>Login</span>
            </Link>
            <Link to="/register" className="nav-item login-btn">
              <div className="icon">📝</div>
              <span>Register</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
