import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await updateProfile(formData);
    setLoading(false);
    if (result.success) {
      setMessage('Profile updated successfully');
      setEditing(false);
    } else {
      setMessage(result.error || 'Failed to update profile');
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title">My Profile</h1>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className="badge badge-primary">{user?.role}</span>
            </div>
          </div>

          {message && (
            <div className={`profile-message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {!editing ? (
            <div className="profile-details">
              <div className="detail-group">
                <label>Full Name</label>
                <p>{user?.name}</p>
              </div>
              <div className="detail-group">
                <label>Email</label>
                <p>{user?.email}</p>
              </div>
              <div className="detail-group">
                <label>Phone</label>
                <p>{user?.phone || 'Not provided'}</p>
              </div>
              <div className="detail-group">
                <label>Address</label>
                <p>{user?.address || 'Not provided'}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  className="input"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <LoadingSpinner size="small" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`
        .profile-page {
          padding: 32px 0;
        }
        .page-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 24px;
        }
        .profile-card {
          background: var(--white);
          border-radius: var(--radius-md);
          padding: 32px;
          box-shadow: var(--shadow);
          max-width: 600px;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--gray-200);
        }
        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--primary);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
        }
        .profile-info h2 {
          font-size: 22px;
          font-weight: 700;
        }
        .profile-email {
          color: var(--gray-600);
          margin: 4px 0;
        }
        .profile-message {
          padding: 12px 16px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          font-size: 14px;
        }
        .profile-message.success {
          background: rgba(40, 167, 69, 0.1);
          color: var(--success);
        }
        .profile-message.error {
          background: rgba(220, 53, 69, 0.1);
          color: var(--danger);
        }
        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .detail-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-group p {
          font-size: 16px;
          margin-top: 4px;
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-weight: 600;
          font-size: 14px;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}

export default Profile;
