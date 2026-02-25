import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt?: string;
}

const AdminUserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<{type: 'success' | 'error'; text: string} | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        fetch('/api/users')
        .then ((r) => r.json())
        .then ((data) => {
            if(Array.isArray(data)) {
                setUsers(data);
                setError(null);
            }
            else{setError('Unexpected response from server');}
            setLoading(false);
        })
        .catch(() => {
            setError('Failed to load user database');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    //will need functions for deactiving, updating roles, maybe even passwords on user account lockout

    if (loading) return <div className='dashboard-layout'>Loading...</div>;
    if (error) return <div className='dashboard-layout'>Error: {error}</div>;

    return (
        <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>User Management</h2>
        </header>

        </main>
        </div>
    );
};

export default AdminUserManagement;