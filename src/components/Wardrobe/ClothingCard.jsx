import './ClothingCard.css';

export default function ClothingCard({ item, onDelete, onSelect, selected, onToggleFavorite, onGenerateWithItem }) {
    const categoryIcons = {
        top: 'bx bx-t-shirt',
        bottom: 'bx bx-pant',
        shoes: 'bx bx-sneaker',
        outerwear: 'bx bx-layers',
        dress: 'bx bx-dress',
        suit: 'bx bx-user-pin',
        accessory: 'bx bx-shopping-bag'
    };

    return (
        <div
            className={`clothing-card ${selected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div className="card-image-container">
                <img src={item.imageUrl} alt={item.description} className="card-image" />
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                    </svg>
                                ) : (
                                    <i className='bx bx-star'></i>
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
