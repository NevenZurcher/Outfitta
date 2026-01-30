import './OutfitCollage.css';

export default function OutfitCollage({ selectedItems }) {
    if (!selectedItems || selectedItems.length === 0) {
        return null;
    }

    // Group items by category for organized display
    const categorizedItems = {
        top: selectedItems.find(item => item.category === 'top'),
        bottom: selectedItems.find(item => item.category === 'bottom'),
        shoes: selectedItems.find(item => item.category === 'shoes'),
        outerwear: selectedItems.find(item => item.category === 'outerwear'),
        accessories: selectedItems.filter(item => item.category === 'accessory'),
        dress: selectedItems.find(item => item.category === 'dress'),
        suit: selectedItems.find(item => item.category === 'suit')
    };

    // Create ordered display array (remove empty categories)
    const displayOrder = [
        { key: 'outerwear', label: 'Outerwear' },
        { key: 'top', label: 'Top' },
        { key: 'dress', label: 'Dress' },
        { key: 'suit', label: 'Suit' },
        { key: 'bottom', label: 'Bottom' },
        { key: 'shoes', label: 'Shoes' },
        { key: 'accessories', label: 'Accessories' }
    ];

    const itemsToDisplay = displayOrder
        .map(({ key, label }) => {
            if (key === 'accessories') {
                return categorizedItems.accessories.map((item, idx) => ({
                    item,
                    label: `${label} ${idx + 1}`
                }));
            }
            return categorizedItems[key] ? [{ item: categorizedItems[key], label }] : [];
        })
        .flat()
        .filter(Boolean);

    return (
        <div className="outfit-collage">
            <h3 className="collage-title">
                <i className='bx bx-closet'></i> Selected Items
            </h3>
            <div className="collage-grid">
                {itemsToDisplay.map(({ item, label }) => (
                    <div key={item.id} className="collage-item card-glass">
                        <div className="collage-image-wrapper">
                            <img
                                src={item.imageUrl}
                                alt={item.description || label}
                                className="collage-image"
                            />
                            <div className="collage-overlay">
                                <span className="category-badge">{label}</span>
                            </div>
                        </div>
                        <div className="collage-item-info">
                            <p className="item-description">{item.description || 'No description'}</p>
                            {item.colors && item.colors.length > 0 && (
                                <div className="item-colors">
                                    {item.colors.map((color, idx) => (
                                        <span key={idx} className="color-tag">{color}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
