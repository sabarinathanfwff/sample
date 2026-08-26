import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';

function RestaurantCard({ restaurant }) {
  const {
    id,
    name,
    image,
    cuisine,
    rating,
    deliveryTime,
    deliveryFee,
    minOrder,
    isOpen,
  } = restaurant;

  return (
    <Link to={`/restaurant/${id}`} className="restaurant-card card">
      <div className="restaurant-card-image">
        <img src={image || '/placeholder-restaurant.jpg'} alt={name} loading="lazy" />
        {!isOpen && <div className="restaurant-closed-overlay">Closed</div>}
      </div>
      <div className="restaurant-card-body">
        <h3 className="restaurant-card-name">{name}</h3>
        <p className="restaurant-card-cuisine">{cuisine}</p>
        <div className="restaurant-card-meta">
          <StarRating rating={rating} size={14} />
          <span className="meta-item">🕒 {deliveryTime}</span>
        </div>
        <div className="restaurant-card-footer">
          <span className="meta-item">💰 {deliveryFee === 0 ? 'Free' : `$${deliveryFee}`} delivery</span>
          <span className="meta-item">📋 Min ${minOrder}</span>
        </div>
      </div>
      <style>{`
        .restaurant-card {
          display: block;
          text-decoration: none;
          color: inherit;
          transition: var(--transition);
        }
        .restaurant-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .restaurant-card-image {
          position: relative;
          height: 180px;
          overflow: hidden;
        }
        .restaurant-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .restaurant-card:hover .restaurant-card-image img {
          transform: scale(1.05);
        }
        .restaurant-closed-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-weight: 700;
          font-size: 18px;
        }
        .restaurant-card-body {
          padding: 16px;
        }
        .restaurant-card-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .restaurant-card-cuisine {
          color: var(--gray-600);
          font-size: 14px;
          margin-bottom: 12px;
        }
        .restaurant-card-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .restaurant-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--gray-600);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </Link>
  );
}

export default RestaurantCard;
