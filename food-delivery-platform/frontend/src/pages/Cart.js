import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import CartItem from '../../components/order/CartItem';
import styles from '../../styles/Cart.module.css';

function Cart() {
  const { items, getSubtotal, isEmpty, clearCart } = useCart();
  const navigate = useNavigate();

  const deliveryFee = 2.99;
  const tax = getSubtotal() * 0.08;
  const total = getSubtotal() + deliveryFee + tax;

  if (isEmpty) {
    return (
      <div className={`container ${styles['cart-page']}`}>
        <div className={styles['empty-cart']}>
          <div className={styles['empty-cart-icon']}>🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some delicious items from our restaurants</p>
          <Link to="/" className="btn btn-primary">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles['cart-page']}`}>
      <div className={styles['cart-header']}>
        <h1 className={styles['cart-title']}>Your Cart</h1>
        <button className="btn btn-outline btn-sm" onClick={clearCart}>
          Clear Cart
        </button>
      </div>

      <div className={styles['cart-layout']}>
        <div className={styles['cart-items']}>
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className={styles['cart-summary']}>
          <h3 className={styles['summary-title']}>Order Summary</h3>
          <div className={styles['summary-row']}>
            <span>Subtotal</span>
            <span>${getSubtotal().toFixed(2)}</span>
          </div>
          <div className={styles['summary-row']}>
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className={styles['summary-row']}>
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className={styles['summary-divider']}></div>
          <div className={styles['summary-total']}>
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 20 }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
          <Link to="/" className="btn btn-outline" style={{ width: '100%', marginTop: 8 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
