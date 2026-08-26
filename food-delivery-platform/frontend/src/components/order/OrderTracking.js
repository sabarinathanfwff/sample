import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderAPI.track(id);
        setOrder(response.data);
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading order details..." />;
  if (error) return <div className="error-message">{error}</div>;
  if (!order) return <div className="error-message">Order not found</div>;

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'on the way', label: 'On the Way', icon: '🚗' },
    { key: 'delivered', label: 'Delivered', icon: '📦' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="order-tracking">
      <div className="tracking-header">
        <h2>Order #{order.id}</h2>
        <p className="tracking-restaurant">{order.restaurantName}</p>
      </div>

      <div className="tracking-steps">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`tracking-step ${index <= currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'current' : ''}`}
          >
            <div className="step-icon">{step.icon}</div>
            <div className="step-label">{step.label}</div>
            {index < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>

      <div className="tracking-details">
        <div className="detail-row">
          <span className="detail-label">Order Total</span>
          <span className="detail-value">${order.total?.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Delivery Address</span>
          <span className="detail-value">{order.deliveryAddress}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Estimated Delivery</span>
          <span className="detail-value">{order.estimatedDelivery || 'Calculating...'}</span>
        </div>
      </div>

      <div className="tracking-items">
        <h3>Order Items</h3>
        {order.items?.map((item, idx) => (
          <div key={idx} className="tracking-item">
            <span>{item.quantity}x {item.name}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <style>{`
        .order-tracking {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .tracking-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .tracking-header h2 {
          font-size: 24px;
          font-weight: 700;
        }
        .tracking-restaurant {
          color: var(--gray-600);
          margin-top: 4px;
        }
        .tracking-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin-bottom: 40px;
        }
        .tracking-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .step-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          z-index: 1;
          transition: var(--transition);
        }
        .tracking-step.completed .step-icon {
          background: var(--success);
        }
        .tracking-step.current .step-icon {
          background: var(--primary);
          box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.2);
        }
        .step-label {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--gray-600);
          text-align: center;
        }
        .tracking-step.completed .step-label,
        .tracking-step.current .step-label {
          color: var(--secondary);
          font-weight: 600;
        }
        .step-connector {
          position: absolute;
          top: 24px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: var(--gray-200);
          z-index: 0;
        }
        .tracking-step.completed .step-connector {
          background: var(--success);
        }
        .tracking-details {
          background: var(--white);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: var(--shadow);
          margin-bottom: 24px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--gray-200);
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: var(--gray-600);
          font-size: 14px;
        }
        .detail-value {
          font-weight: 600;
          font-size: 14px;
          text-align: right;
          max-width: 60%;
        }
        .tracking-items {
          background: var(--white);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: var(--shadow);
        }
        .tracking-items h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .tracking-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          border-bottom: 1px solid var(--gray-100);
        }
        .tracking-item:last-child {
          border-bottom: none;
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

export default OrderTracking;
