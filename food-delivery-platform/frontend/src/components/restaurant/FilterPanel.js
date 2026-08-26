import React from 'react';

function FilterPanel({ filters, onFilterChange }) {
  const cuisines = ['All', 'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'American', 'Mediterranean'];
  const sortOptions = [
    { value: 'rating', label: 'Top Rated' },
    { value: 'deliveryTime', label: 'Fastest Delivery' },
    { value: 'deliveryFee', label: 'Lowest Fee' },
    { value: 'minOrder', label: 'Lowest Min Order' },
  ];

  const handleCuisineClick = (cuisine) => {
    onFilterChange({ ...filters, cuisine: cuisine === 'All' ? '' : cuisine });
  };

  const handleSortChange = (e) => {
    onFilterChange({ ...filters, sortBy: e.target.value });
  };

  const handleOpenChange = (e) => {
    onFilterChange({ ...filters, openNow: e.target.checked });
  };

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h4 className="filter-title">Cuisines</h4>
        <div className="filter-cuisines">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              className={`filter-chip ${filters.cuisine === cuisine || (cuisine === 'All' && !filters.cuisine) ? 'active' : ''}`}
              onClick={() => handleCuisineClick(cuisine)}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4 className="filter-title">Sort By</h4>
        <select className="filter-select" value={filters.sortBy} onChange={handleSortChange}>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={handleOpenChange}
          />
          <span>Open Now Only</span>
        </label>
      </div>
      <style>{`
        .filter-panel {
          background: var(--white);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .filter-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-700);
          margin-bottom: 10px;
        }
        .filter-cuisines {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .filter-chip {
          padding: 6px 14px;
          border: 2px solid var(--gray-300);
          border-radius: 20px;
          background: var(--white);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
        }
        .filter-chip:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .filter-chip.active {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--white);
        }
        .filter-select {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid var(--gray-300);
          border-radius: var(--radius);
          font-size: 14px;
          font-family: inherit;
          background: var(--white);
          cursor: pointer;
        }
        .filter-select:focus {
          outline: none;
          border-color: var(--primary);
        }
        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .filter-checkbox input {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }
      `}</style>
    </div>
  );
}

export default FilterPanel;
