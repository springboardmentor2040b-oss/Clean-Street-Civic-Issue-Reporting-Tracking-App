import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';
import './AdminComplaintsTable.css'; // Reusing some styles
import logo from '../assets/logo.jpeg';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await fetch('http://localhost:5001/api/users', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate('/login');
                        return;
                    } else if (response.status === 403) {
                        setError('Access denied. Admin role required.');
                        return;
                    } else {
                        throw new Error('Failed to fetch users');
                    }
                }
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError('Failed to fetch users. Please try again later.');
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [navigate]);

    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="admin-page">
            <AdminSidebar logo={logo} />
            <div className="admin-main">
                <header className="admin-top">
                    <h1>User Management</h1>
                </header>
                <div className="complaints-table">
                    <h2>All Users</h2>
                    {users.length === 0 ? (
                        <p>No users found.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Citizen ID</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>{user.name || 'N/A'}</td>
                                        <td>{user.username || 'N/A'}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>{user.citizenId || 'N/A'}</td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
