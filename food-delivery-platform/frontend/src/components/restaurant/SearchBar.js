import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBar({ onSearch, initialValue = '', placeholder = 'Search restaurants, cuisines...' }) {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary search-btn">
        Search
      </button>
      <style>{`
        .search-bar {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          font-size: 16px;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 12px 36px 12px 42px;
          border: 2px solid var(--gray-300);
          border-radius: var(--radius);
          font-size: 15px;
          transition: var(--transition);
          font-family: inherit;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }
        .search-clear {
          position: absolute;
          right: 12px;
          background: var(--gray-200);
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: var(--gray-600);
          cursor: pointer;
          transition: var(--transition);
        }
        .search-clear:hover {
          background: var(--gray-300);
        }
        .search-btn {
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .search-bar {
            flex-direction: column;
          }
          .search-btn {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
}

export default SearchBar;
