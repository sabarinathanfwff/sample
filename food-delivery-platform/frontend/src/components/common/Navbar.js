import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import './../../styles/global.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = getItemCount();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">🍔</span>
          <span className="navbar-title">FoodHub</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                My Orders
              </Link>
              <Link to="/profile" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                Profile
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
              )}
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <Link to="/owner" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              <Link to="/cart" className="navbar-link cart-link" onClick={() => setMobileMenuOpen(false)}>
                Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <div className="navbar-user">
                <span className="navbar-username">{user?.name}</span>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
              <Link to="/cart" className="navbar-link cart-link">
                Cart
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--navbar-height);
          background: var(--white);
          box-shadow: var(--shadow);
          z-index: 1000;
        }
        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 22px;
          color: var(--secondary);
        }
        .navbar-logo {
          font-size: 28px;
        }
        .navbar-title {
          color: var(--primary);
        }
        .navbar-toggle {
          display: none;
          background: none;
          border: none;
          padding: 8px;
        }
        .hamburger {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--secondary);
          position: relative;
          transition: var(--transition);
        }
        .hamburger::before,
        .hamburger::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 2px;
          background: var(--secondary);
          transition: var(--transition);
        }
        .hamburger::before { top: -8px; }
        .hamburger::after { top: 8px; }
        .hamburger.active { background: transparent; }
        .hamburger.active::before { transform: rotate(45deg); top: 0; }
        .hamburger.active::after { transform: rotate(-45deg); top: 0; }
        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .navbar-link {
          padding: 8px 16px;
          border-radius: var(--radius);
          font-weight: 500;
          transition: var(--transition);
          color: var(--gray-700);
        }
        .navbar-link:hover {
          background: var(--gray-100);
          color: var(--primary);
        }
        .cart-link {
          position: relative;
        }
        .cart-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          background: var(--primary);
          color: var(--white);
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .navbar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: 8px;
          padding-left: 16px;
          border-left: 1px solid var(--gray-300);
        }
        .navbar-username {
          font-weight: 600;
          font-size: 14px;
        }
        .navbar-auth {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 768px) {
          .navbar-toggle {
            display: block;
          }
          .navbar-menu {
            position: fixed;
            top: var(--navbar-height);
            left: 0;
            right: 0;
            background: var(--white);
            flex-direction: column;
            padding: 16px;
            box-shadow: var(--shadow-md);
            transform: translateY(-100%);
            opacity: 0;
            pointer-events: none;
            transition: var(--transition);
          }
          .navbar-menu.active {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
          }
          .navbar-user {
            flex-direction: column;
            border-left: none;
            border-top: 1px solid var(--gray-300);
            padding-top: 16px;
            margin-top: 8px;
            width: 100%;
          }
          .navbar-auth {
            flex-direction: column;
            width: 100%;
          }
          .navbar-auth .btn {
            width: 100%;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
