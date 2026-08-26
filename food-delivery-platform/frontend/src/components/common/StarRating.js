import React from 'react';

function StarRating({ rating = 0, maxStars = 5, size = 16, interactive = false, onChange }) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };

  const handleMouseEnter = (index) => {
    if (interactive) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="star-rating" onMouseLeave={handleMouseLeave}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= displayRating;
        const isHalf = !isFilled && starIndex - 0.5 <= displayRating;

        return (
          <span
            key={i}
            className={`star ${isFilled ? 'filled' : ''} ${isHalf ? 'half' : ''} ${interactive ? 'interactive' : ''}`}
            style={{ fontSize: size }}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
          >
            {isFilled ? '★' : isHalf ? '★' : '☆'}
          </span>
        );
      })}
      {rating > 0 && (
        <span className="rating-value" style={{ fontSize: size - 2 }}>
          {rating.toFixed(1)}
        </span>
      )}
      <style>{`
        .star-rating {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .star {
          color: var(--gray-300);
          line-height: 1;
        }
        .star.filled {
          color: var(--accent);
        }
        .star.half {
          color: var(--accent);
          opacity: 0.6;
        }
        .star.interactive {
          cursor: pointer;
          transition: transform 0.1s;
        }
        .star.interactive:hover {
          transform: scale(1.2);
        }
        .rating-value {
          margin-left: 4px;
          font-weight: 600;
          color: var(--gray-700);
        }
      `}</style>
    </div>
  );
}

export default StarRating;
