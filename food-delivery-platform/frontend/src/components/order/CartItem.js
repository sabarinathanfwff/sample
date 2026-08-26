import React from 'react';
import { useCart } from '../../hooks/useCart';

function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.name}</h4>
        <p className="cart-item-price">${item.price.toFixed(2)}</p>
        <div className="cart-item-actions">
          <div className="quantity-control">
            <button
              className="quantity-btn"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="quantity-value">{item.quantity}</span>
            <button
              className="quantity-btn"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button className="remove-btn" onClick={() => removeItem(item.id)}>
            Remove
          </button>
        </div>
      </div>
      <div className="cart-item-total">
        <span>${(item.price * item.quantity).toFixed(2)}</span>
      </div>
      <style>{`
        .cart-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--gray-200);
        }
        .cart-item:last-child {
          border-bottom: none;
        }
        .cart-item-info {
          flex: 1;
        }
        .cart-item-name {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .cart-item-price {
          color: var(--gray-600);
          font-size: 13px;
          margin-bottom: 8px;
        }
        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .quantity-control {
          display: flex;
          align-items: center;
          border: 2px solid var(--gray-300);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .quantity-btn {
          width: 30px;
          height: 30px;
          border: none;
          background: var(--gray-100);
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }
        .quantity-btn:hover {
          background: var(--gray-200);
        }
        .quantity-value {
          width: 32px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
        }
        .remove-btn {
          color: var(--danger);
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 500;
          padding: 4px 8px;
        }
        .remove-btn:hover {
          text-decoration: underline;
        }
        .cart-item-total {
          font-weight: 700;
          font-size: 16px;
          color: var(--secondary);
        }
      `}</style>
    </div>
  );
}

export default CartItem;
