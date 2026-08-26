import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';

function OrderCard({ order }) {
  const statusColors = {
    pending: 'badge-warning',
    confirmed: 'badge-primary',
    preparing: 'badge-primary',
    'on the way': 'badge-warning',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="order-card card">
      <div className="order-card-header">
        <div>
          <h4 className="order-restaurant">{order.restaurantName || 'Restaurant'}</h4>
          <p className="order-date">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${statusColors[order.status] || 'badge-warning'}`}>
          {order.status}
        </span>
      </div>

      <div className="order-card-items">
        {order.items?.map((item, idx) => (
          <span key={idx} className="order-item-tag">
            {item.quantity}x {item.name}
          </span>
        ))}
      </div>

      <div className="order-card-footer">
        <span className="order-total">Total: ${order.total?.toFixed(2)}</span>
        <div className="order-actions">
          {order.status === 'delivered' && !order.reviewed && (
            <button className="btn btn-outline btn-sm">Rate Order</button>
          )}
          <Link to={`/orders/${order.id}`} className="btn btn-primary btn-sm">
            Track Order
          </Link>
        </div>
      </div>

      {order.rating && (
        <div className="order-rating">
          <StarRating rating={order.rating} size={14} />
        </div>
      )}
      <style>{`
        .order-card {
          padding: 20px;
          margin-bottom: 16px;
        }
        .order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .order-restaurant {
          font-size: 16px;
          font-weight: 700;
        }
        .order-date {
          font-size: 13px;
          color: var(--gray-600);
          margin-top: 2px;
        }
        .order-card-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .order-item-tag {
          background: var(--gray-100);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          color: var(--gray-700);
        }
        .order-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-total {
          font-weight: 700;
          font-size: 16px;
        }
        .order-actions {
          display: flex;
          gap: 8px;
        }
        .order-rating {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--gray-200);
        }
      `}</style>
    </div>
  );
}

export default OrderCard;
