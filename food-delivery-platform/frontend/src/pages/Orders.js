import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import OrderCard from '../../components/order/OrderCard';
import OrderTracking from '../../components/order/OrderTracking';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderAPI.getAll();
        setOrders(response.data);
      } catch (err) {
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (selectedOrderId) {
    return (
      <div className="container">
        <button className="btn btn-outline btn-sm back-btn" onClick={() => setSelectedOrderId(null)}>
          ← Back to Orders
        </button>
        <OrderTracking />
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">My Orders</h1>

        {loading ? (
          <LoadingSpinner text="Loading orders..." />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h2>No orders yet</h2>
            <p>Your order history will appear here</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
      <style>{`
        .orders-page {
          padding: 32px 0;
        }
        .page-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 24px;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }
        .empty-icon {
          font-size: 64px;
        }
        .empty-state h2 {
          font-size: 24px;
          margin: 16px 0 8px;
        }
        .empty-state p {
          color: var(--gray-600);
        }
        .back-btn {
          margin-bottom: 20px;
        }
        .error-message {
          text-align: center;
          padding: 40px;
          color: var(--danger);
        }
      `}</style>
    </div>
  );
}

export default Orders;
