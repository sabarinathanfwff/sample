import React from 'react';
import { useCart } from '../../hooks/useCart';

function MenuItemCard({ item, restaurant }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(item, restaurant);
  };

  return (
    <div className="menu-item-card">
      <div className="menu-item-info">
        <h4 className="menu-item-name">{item.name}</h4>
        <p className="menu-item-desc">{item.description}</p>
        <div className="menu-item-meta">
          <span className="menu-item-price">${item.price.toFixed(2)}</span>
          {item.popular && <span className="badge badge-primary">Popular</span>}
          {item.vegetarian && <span className="badge badge-success">Veg</span>}
          {item.spicy && <span className="badge badge-danger">Spicy</span>}
        </div>
      </div>
      <div className="menu-item-actions">
        {item.image && (
          <img src={item.image} alt={item.name} className="menu-item-image" />
        )}
        <button className="btn btn-primary btn-sm add-btn" onClick={handleAddToCart}>
          ADD
        </button>
      </div>
      <style>{`
        .menu-item-card {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          transition: var(--transition);
        }
        .menu-item-card:hover {
          border-color: var(--primary-light);
          box-shadow: var(--shadow-sm);
        }
        .menu-item-info {
          flex: 1;
          padding-right: 16px;
        }
        .menu-item-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .menu-item-desc {
          font-size: 13px;
          color: var(--gray-600);
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .menu-item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .menu-item-price {
          font-weight: 700;
          color: var(--secondary);
          font-size: 15px;
        }
        .menu-item-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .menu-item-image {
          width: 80px;
          height: 80px;
          border-radius: var(--radius);
          object-fit: cover;
        }
        .add-btn {
          min-width: 60px;
        }
      `}</style>
    </div>
  );
}

export default MenuItemCard;
