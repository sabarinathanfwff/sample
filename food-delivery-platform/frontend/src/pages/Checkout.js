import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useOrders } from '../../hooks/useOrders';
import { paymentAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function Checkout() {
  const { items, getSubtotal, clearCart, restaurantId } = useCart();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    instructions: '',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const deliveryFee = 2.99;
  const tax = getSubtotal() * 0.08;
  const total = getSubtotal() + deliveryFee + tax;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!formData.address || !formData.city || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: `${formData.address}, ${formData.city} ${formData.zipCode}`,
        phone: formData.phone,
        instructions: formData.instructions,
        paymentMethod: formData.paymentMethod,
        subtotal: getSubtotal(),
        deliveryFee,
        tax,
        total,
      };

      const orderResult = await createOrder(orderData);
      if (orderResult.success) {
        if (formData.paymentMethod === 'card') {
          await paymentAPI.confirm({
            orderId: orderResult.data.id,
            cardNumber: formData.cardNumber,
          });
        }
        clearCart();
        navigate(`/orders/${orderResult.data.id}`);
      } else {
        setError(orderResult.error);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Delivery</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Payment</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="checkout-layout">
          <div className="checkout-form">
            {step === 1 && (
              <form onSubmit={handleStep1Submit}>
                <h2 className="form-title">Delivery Information</h2>
                <div className="form-group">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    className="input"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      className="input"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      className="input"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="10001"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Instructions</label>
                  <textarea
                    name="instructions"
                    className="input"
                    value={formData.instructions}
                    onChange={handleChange}
                    placeholder="Ring the doorbell, leave at door, etc."
                    rows={3}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-lg">
                  Continue to Payment
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2Submit}>
                <h2 className="form-title">Payment Method</h2>
                <div className="payment-methods">
                  <label className={`payment-option ${formData.paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                    />
                    <span>💳 Credit/Debit Card</span>
                  </label>
                  <label className={`payment-option ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={handleChange}
                    />
                    <span>💵 Cash on Delivery</span>
                  </label>
                </div>

                {formData.paymentMethod === 'card' && (
                  <div className="card-form">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        className="input"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          className="input"
                          value={formData.cardExpiry}
                          onChange={handleChange}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div className="form-group">
                        <label>CVC</label>
                        <input
                          type="text"
                          name="cardCvc"
                          className="input"
                          value={formData.cardCvc}
                          onChange={handleChange}
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="checkout-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? <LoadingSpinner size="small" /> : `Pay $${total.toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            {items.map((item) => (
              <div key={item.id} className="summary-item">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="summary-divider"></div>
            <div className="summary-item">
              <span>Subtotal</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span>Delivery</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .checkout-page {
          padding: 32px 0;
        }
        .checkout-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 24px;
        }
        .checkout-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .step {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gray-300);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }
        .step.active .step-number {
          background: var(--primary);
          color: var(--white);
        }
        .step-label {
          font-weight: 600;
          color: var(--gray-600);
        }
        .step.active .step-label {
          color: var(--secondary);
        }
        .step-connector {
          width: 60px;
          height: 2px;
          background: var(--gray-300);
        }
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }
        .checkout-form {
          background: var(--white);
          border-radius: var(--radius-md);
          padding: 32px;
          box-shadow: var(--shadow);
        }
        .form-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 24px;
        }
        .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-weight: 600;
          font-size: 14px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .payment-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 2px solid var(--gray-300);
          border-radius: var(--radius);
          cursor: pointer;
          transition: var(--transition);
        }
        .payment-option:hover,
        .payment-option.selected {
          border-color: var(--primary);
        }
        .payment-option input {
          accent-color: var(--primary);
        }
        .card-form {
          margin-bottom: 24px;
        }
        .checkout-actions {
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }
        .order-summary {
          background: var(--white);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow);
          position: sticky;
          top: 92px;
        }
        .summary-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .summary-item.total {
          font-size: 18px;
          font-weight: 700;
        }
        .summary-divider {
          height: 1px;
          background: var(--gray-200);
          margin: 12px 0;
        }
        .auth-error {
          background: rgba(220, 53, 69, 0.1);
          color: var(--danger);
          padding: 12px 16px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }
          .order-summary {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}

export default Checkout;
