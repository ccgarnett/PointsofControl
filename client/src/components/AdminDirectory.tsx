import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { SkeletonPage } from './Skeleton';
import { useAuth } from '../context/AuthContext';

interface User {
    _id: string;
    username?: string;
    name?: string;
    email?: string;
    role?: string;
    createdAt?: string;
}

const AdminDirectory: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        document.title = 'Points of Control — User Directory';
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        fetch('/api/users')
        .then((r) => r.json())
        .then((data) => {
            if (Array.isArray(data)) {
                setUsers(data);
                setError(null);
            } else {
                setError('Unexpected response from server');
            }
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

    const handleRoleToggle = async (u: User) => {
        const newRole = u.role === 'Admin' ? 'User' : 'Admin';
        setTogglingRoleId(u._id);
        try {
            const res = await fetch(`/api/users/${u._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error('Failed to update role');
            fetchUsers();
        } catch {
            setError('Could not update role');
        } finally {
            setTogglingRoleId(null);
        }
    };

    const handleRemoveUser = async (id: string) => {
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setConfirmDeleteId(null);
            fetchUsers();
        } catch {
            setError('Could not remove user');
        }
    };

    if (loading) return <SkeletonPage cards={3} />;
    if (error) return <div className="dashboard-layout">Error: {error}</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <header className="top-header">
                    <h1>Points Of Control</h1>
                    <h2>User Management</h2>
                </header>

                {users.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <h3>No users found</h3>
                        <p>No users are currently in the database.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id}>
                                    <td>{u.username ?? '-'}</td>
                                    <td>{u.name ?? '-'}</td>
                                    <td>{u.email ?? '-'}</td>
                                    <td>
                                        <span className={`badge ${u.role === 'Admin' ? 'badge-admin' : 'badge-user'}`}>
                                            {u.role ?? 'User'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {u._id !== currentUser?.id && (
                                                <>
                                                    <button
                                                        className="btn-role-toggle"
                                                        onClick={() => handleRoleToggle(u)}
                                                        disabled={togglingRoleId === u._id}
                                                    >
                                                        {u.role === 'Admin' ? 'Make User' : 'Make Admin'}
                                                    </button>
                                                    {confirmDeleteId === u._id ? (
                                                        <div className="inline-confirm">
                                                            <span>Remove?</span>
                                                            <button className="btn-confirm-yes" onClick={() => handleRemoveUser(u._id)}>Yes</button>
                                                            <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                                                        </div>
                                                    ) : (
                                                        <button className="btn-danger-sm" onClick={() => setConfirmDeleteId(u._id)}>Remove</button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
};

export default AdminDirectory;
