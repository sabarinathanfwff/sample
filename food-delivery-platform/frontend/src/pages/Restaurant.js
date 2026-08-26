import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { restaurantAPI } from '../../services/api';
import MenuItemCard from '../../components/restaurant/MenuItemCard';
import StarRating from '../../components/common/StarRating';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCart } from '../../hooks/useCart';
import styles from '../../styles/Restaurant.module.css';

function Restaurant() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { items, getSubtotal, addItem } = useCart();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const [restRes, menuRes] = await Promise.all([
          restaurantAPI.getById(id),
          restaurantAPI.getMenu(id),
        ]);
        setRestaurant(restRes.data);
        setMenu(menuRes.data);
      } catch (err) {
        setError('Failed to load restaurant');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading restaurant..." />;
  if (error) return <div className="error-message">{error}</div>;
  if (!restaurant) return <div className="error-message">Restaurant not found</div>;

  const menuByCategory = menu.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className={styles['restaurant-page']}>
      <div
        className={styles['restaurant-hero']}
        style={{ backgroundImage: `url(${restaurant.image || '/placeholder-restaurant.jpg'})` }}
      >
        <div className={styles['restaurant-hero-content']}>
          <h1 className={styles['restaurant-name']}>{restaurant.name}</h1>
          <div className={styles['restaurant-meta']}>
            <StarRating rating={restaurant.rating} size={16} />
            <span>🕒 {restaurant.deliveryTime}</span>
            <span>💰 {restaurant.deliveryFee === 0 ? 'Free' : `$${restaurant.deliveryFee}`} delivery</span>
            <span>📋 Min ${restaurant.minOrder}</span>
          </div>
        </div>
      </div>

      <div className={`container ${styles['restaurant-info']}`}>
        <div className={styles['menu-section']}>
          <h2 className="section-title">Menu</h2>
          {Object.entries(menuByCategory).map(([category, items]) => (
            <div key={category} className={styles['menu-category']}>
              <h3 className={styles['menu-category-title']}>{category}</h3>
              <div className={styles['menu-grid']}>
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} restaurant={restaurant} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className={styles['cart-sidebar']}>
          <div className={styles['cart-summary-card']}>
            <h3 className={styles['cart-summary-title']}>Your Order</h3>
            {items.length === 0 ? (
              <p className="text-muted">Your cart is empty</p>
            ) : (
              <>
                <div className={styles['summary-row']}>
                  <span>Subtotal</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                <div className={styles['summary-row']}>
                  <span>Delivery Fee</span>
                  <span>{restaurant.deliveryFee === 0 ? 'Free' : `$${restaurant.deliveryFee}`}</span>
                </div>
                <div className={styles['cart-summary-total']}>
                  <span>Total</span>
                  <span>${(getSubtotal() + (restaurant.deliveryFee || 0)).toFixed(2)}</span>
                </div>
                <Link to="/cart" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
                  View Cart
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <div className="container">
        <div className={styles['reviews-section']}>
          <h2 className="section-title">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-muted">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <strong>{review.userName}</strong>
                  <StarRating rating={review.rating} size={14} />
                </div>
                <p>{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Restaurant;
