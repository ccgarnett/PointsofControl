import React from 'react';
import Sidebar from './Sidebar';

const AccountSettings: React.FC = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Account Settings</h2>
        </header>
        <p>Account settings coming soon.</p>
      </main>
    </div>
  );
};

export default AccountSettings;