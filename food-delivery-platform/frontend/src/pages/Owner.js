import React, { useState, useEffect } from 'react';
import { restaurantAPI, orderAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StarRating from '../../components/common/StarRating';

function Owner() {
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    avgRating: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restRes, ordersRes] = await Promise.all([
          restaurantAPI.getAll({ ownerId: 'current' }),
          orderAPI.getAll(),
        ]);
        setRestaurants(restRes.data);
        setOrders(ordersRes.data);

        const totalRevenue = ordersRes.data.reduce((sum, o) => sum + (o.total || 0), 0);
        const pending = ordersRes.data.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
        setStats({
          totalOrders: ordersRes.data.length,
          revenue: totalRevenue,
          avgRating: restRes.data.reduce((sum, r) => sum + (r.rating || 0), 0) / (restRes.data.length || 1),
          pendingOrders: pending,
        });
      } catch (err) {
        console.error('Failed to fetch owner data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      console.error('Failed to update order status');
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'orders', label: 'Orders' },
    { key: 'restaurants', label: 'Restaurants' },
  ];

  return (
    <div className="owner-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Restaurant Dashboard</h1>
          <p>Manage your restaurants and orders</p>
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
              <div className="stat-icon">📦</div>
              <div className="stat-value">{stats.totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">${stats.revenue.toFixed(0)}</div>
              <div className="stat-label">Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{stats.avgRating.toFixed(1)}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-value">{stats.pendingOrders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>${order.total?.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status === 'pending' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusUpdate(order.id, 'confirmed')}>
                          Accept
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(order.id, 'preparing')}>
                          Prepare
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div className="restaurants-grid">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="restaurant-manage-card">
                <img src={restaurant.image || '/placeholder-restaurant.jpg'} alt={restaurant.name} />
                <div className="restaurant-manage-info">
                  <h3>{restaurant.name}</h3>
                  <StarRating rating={restaurant.rating} size={14} />
                  <p className="text-muted">{restaurant.cuisine}</p>
                  <div className="restaurant-manage-actions">
                    <button className="btn btn-sm btn-outline">Edit</button>
                    <button className="btn btn-sm btn-primary">View Menu</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .owner-dashboard {
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
        .orders-table-wrapper {
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
        .restaurants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .restaurant-manage-card {
          background: var(--white);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        .restaurant-manage-card img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .restaurant-manage-info {
          padding: 16px;
        }
        .restaurant-manage-info h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .restaurant-manage-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
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

export default Owner;
