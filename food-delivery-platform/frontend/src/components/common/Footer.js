import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo">🍔 FoodHub</span>
            <p className="footer-desc">
              AI-powered food delivery platform connecting you with the best restaurants in your area.
            </p>
          </div>
          <div className="footer-links">
            <h4 className="footer-heading">Company</h4>
            <Link to="/" className="footer-link">About Us</Link>
            <Link to="/" className="footer-link">Careers</Link>
            <Link to="/" className="footer-link">Blog</Link>
          </div>
          <div className="footer-links">
            <h4 className="footer-heading">Support</h4>
            <Link to="/" className="footer-link">Help Center</Link>
            <Link to="/" className="footer-link">Contact</Link>
            <Link to="/" className="footer-link">Privacy Policy</Link>
          </div>
          <div className="footer-links">
            <h4 className="footer-heading">For Restaurants</h4>
            <Link to="/owner" className="footer-link">Partner with us</Link>
            <Link to="/owner" className="footer-link">Restaurant dashboard</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FoodHub. All rights reserved.</p>
        </div>
      </div>
      <style>{`
        .footer {
          background: var(--secondary);
          color: var(--white);
          padding: 48px 0 24px;
          margin-top: auto;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        .footer-logo {
          font-size: 22px;
          font-weight: 800;
          color: var(--primary);
        }
        .footer-desc {
          margin-top: 12px;
          color: var(--gray-400);
          font-size: 14px;
          line-height: 1.6;
        }
        .footer-heading {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .footer-link {
          display: block;
          color: var(--gray-400);
          font-size: 14px;
          padding: 4px 0;
          transition: var(--transition);
        }
        .footer-link:hover {
          color: var(--primary);
        }
        .footer-bottom {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          color: var(--gray-500);
          font-size: 13px;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;
