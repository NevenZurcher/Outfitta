import { useState } from 'react';
import './ClothingCard.css';

export default function ClothingCard({ item, onDelete, onSelect, selected, onToggleFavorite, onGenerateWithItem, onViewDetails, onToggleLaundry }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const categoryIcons = {
        top: 'bx bx-t-shirt',
        bottom: 'bx bx-pant',
        shoes: 'bx bx-sneaker',
        outerwear: 'bx bx-layers',
        dress: 'bx bx-dress',
        suit: 'bx bx-user-pin',
        accessory: 'bx bx-shopping-bag'
    };

    const handleCardClick = () => {
        if (onViewDetails) {
            onViewDetails();
        } else if (onSelect) {
            onSelect();
        }
    };

    return (
        <div
            className={`clothing-card ${selected ? 'selected' : ''}`}
            onClick={handleCardClick}
        >
            <div className="card-image-container">
                {!imageLoaded && <div className="image-skeleton"></div>}
                <img
                    src={item.imageUrl}
                    alt={item.description}
                    className={`card-image ${imageLoaded ? 'loaded' : ''}`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                />
                {item.inLaundry && (
                    <div className="laundry-overlay">
                        <span className="laundry-badge">
                            <i className='bx bx-basket'></i> In Laundry
                        </span>
                    </div>
                )}
                <div className={`card-actions ${item.favorite ? 'has-favorite' : ''}`}>
                    {onToggleFavorite && (
                        <div className={`favorite-btn-container ${item.favorite ? 'is-favorite' : ''}`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite();
                                }}
                                className={`action-btn favorite-btn ${item.favorite ? 'favorite-active' : ''}`}
                                title={item.favorite ? "Remove from favorites" : "Add to favorites"}
                            >
                                {item.favorite ? (
                                    <i className='bx bxs-heart'></i>
                                ) : (
                                    <i className='bx bx-heart'></i>
                                )}
                            </button>
                        </div>
                    )}
                    {onDelete && (
                        <div className="card-actions-left">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="action-btn delete-btn"
                                title="Delete item"
                            >
                                <i className='bx bx-trash'></i>
                            </button>
                        </div>
                    )}
                    {onToggleLaundry && (
                        <div className="card-actions-left" style={{ left: onDelete ? '3.5rem' : '0.5rem' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLaundry();
                                }}
                                className={`action-btn laundry-btn ${item.inLaundry ? 'laundry-active' : ''}`}
                                title={item.inLaundry ? "Mark as clean" : "Add to laundry"}
                            >
                                <i className='bx bx-basket'></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card-content">
                <div className="card-category">
                    <i className={`${categoryIcons[item.category] || 'bx bx-hanger'} category-icon`}></i>
                    <span className="category-text">{item.category}</span>
                </div>

                {item.description && (
                    <p className="card-description">{item.description}</p>
                )}

                {item.colors && item.colors.length > 0 && (
                    <div className="card-colors">
                        {item.colors.map((color, idx) => (
                            <span key={idx} className="color-tag">{color}</span>
                        ))}
                    </div>
                )}

                {onGenerateWithItem && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onGenerateWithItem();
                        }}
                        className="btn btn-secondary btn-sm generate-btn"
                    >
                        <i className='bx bx-sparkles'></i> Generate Outfit
                    </button>
                )}
            </div>
        </div>
    );
}
