import React from 'react';

function LoadingSpinner({ size = 'medium', text = '' }) {
  const sizes = {
    small: { width: 24, border: 2 },
    medium: { width: 40, border: 3 },
    large: { width: 60, border: 4 },
  };

  const { width, border } = sizes[size] || sizes.medium;

  return (
    <div className="loading-spinner-container">
      <div
        className="loading-spinner"
        style={{ width, height: width, borderWidth: border }}
      ></div>
      {text && <p className="loading-text">{text}</p>}
      <style>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
        }
        .loading-spinner {
          border-style: solid;
          border-color: var(--gray-200);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .loading-text {
          color: var(--gray-600);
          font-size: 14px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;
