import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

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
    //const [status, setStatus] = useState<{type: 'success' | 'error'; text: string} | null>(null);
    //const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        fetch('/api/users')
        .then ((r) => r.json())
        .then ((data) => {
            if(Array.isArray(data)) {
                setUsers(data);
                setError(null);
            }
            else{
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

        {users.length === 0 ?(
            <p>No users found in the database.</p>
        ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '1rem'}}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        {/* <th>Created Date</th> */}
                        {/* <th>Updated Date</th> */}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((userVal) => (
                        <tr key={userVal._id}>
                            <td>{userVal._id}</td>
                            <td>{userVal.name ?? userVal.username ?? '-'}</td>
                            <td>{userVal.email ?? '-'}</td>
                            <td>{userVal.role ?? '-'}</td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
        }
        </main>
        </div>
    );
};

export default AdminDirectory;