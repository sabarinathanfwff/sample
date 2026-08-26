import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, ordersRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers(),
          adminAPI.getOrders(),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (!stats) return <div className="error-message">Failed to load dashboard</div>;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'orders', label: 'Orders' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform analytics and management</p>
      </div>

      <div className="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-value">{stats.totalRestaurants}</div>
            <div className="stat-label">Restaurants</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">${stats.totalRevenue?.toFixed(0)}</div>
            <div className="stat-label">Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{stats.ordersToday}</div>
            <div className="stat-label">Orders Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{stats.avgRating?.toFixed(1)}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role === 'admin' ? 'danger' : user.role === 'owner' ? 'primary' : 'success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{order.restaurantName}</td>
                  <td>${order.total?.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        .admin-dashboard {
          padding: 32px 0;
        }
        .dashboard-header {
          margin-bottom: 32px;
        }
        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 800;
        }
        .dashboard-header p {
          color: var(--gray-600);
        }
        .dashboard-tabs {
          display: flex;
          gap: 4px;
          background: var(--gray-200);
          padding: 4px;
          border-radius: var(--radius);
          margin-bottom: 24px;
          width: fit-content;
        }
        .tab-btn {
          padding: 8px 20px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
          color: var(--gray-700);
        }
        .tab-btn.active {
          background: var(--white);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
        }
        .stat-card {
          background: var(--white);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow);
          text-align: center;
        }
        .stat-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: var(--secondary);
        }
        .stat-label {
          font-size: 13px;
          color: var(--gray-600);
          margin-top: 4px;
        }
        .data-table-wrapper {
          background: var(--white);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th,
        .data-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid var(--gray-200);
        }
        .data-table th {
          background: var(--gray-100);
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-700);
        }
        .data-table tr:last-child td {
          border-bottom: none;
        }
        .data-table tr:hover td {
          background: var(--gray-50);
        }
        @media (max-width: 768px) {
          .data-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
