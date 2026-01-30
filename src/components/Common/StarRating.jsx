import { useState } from 'react';
import './StarRating.css';

export default function StarRating({ rating, onRate, readonly = false, size = 'md' }) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (value) => {
        if (!readonly && onRate) {
            onRate(value);
        }
    };

    const handleMouseEnter = (value) => {
        if (!readonly) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverRating(0);
        }
    };

    const displayRating = hoverRating || rating || 0;

    return (
        <div className={`star-rating ${readonly ? 'readonly' : 'interactive'} size-${size}`}>
            {[1, 2, 3, 4, 5].map((value) => (
                <button
                    key={value}
                    type="button"
                    className="star-btn"
                    onClick={() => handleClick(value)}
                    onMouseEnter={() => handleMouseEnter(value)}
                    onMouseLeave={handleMouseLeave}
                    disabled={readonly}
                    aria-label={`Rate ${value} stars`}
                >
                    <i className={`bx bx-star ${value <= displayRating ? 'star-filled' : ''}`}></i>
                </button>
            ))}
            {!readonly && hoverRating > 0 && (
                <span className="rating-label">{hoverRating} star{hoverRating !== 1 ? 's' : ''}</span>
            )}
        </div>
    );
}
