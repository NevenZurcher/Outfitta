import { useState, useEffect } from 'react';
import './ClothingDetailModal.css';

export default function ClothingDetailModal({ item, onClose, onUpdate, onDelete, onToggleLaundry }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState(item.description || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [editedCategory, setEditedCategory] = useState(item.category || 'top');
    const [isEditingColors, setIsEditingColors] = useState(false);
    const [editedColors, setEditedColors] = useState(item.colors || []);
    const [newColor, setNewColor] = useState('');
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

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (isEditing) {
                    handleCancelEdit();
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleEsc);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isEditing, onClose]);

    const handleSaveDescription = async () => {
        const trimmedDescription = editedDescription.trim();

        if (!trimmedDescription) {
            alert('Description cannot be empty');
            return;
        }

        setIsSaving(true);
        const success = await onUpdate(item.id, trimmedDescription);
        setIsSaving(false);

        if (success) {
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedDescription(item.description || '');
        setIsEditing(false);
    };

    const handleSaveCategory = async () => {
        setIsSaving(true);
        const success = await onUpdate(item.id, { category: editedCategory });
        setIsSaving(false);

        if (success) {
            setIsEditingCategory(false);
        }
    };

    const handleCancelCategoryEdit = () => {
        setEditedCategory(item.category || 'top');
        setIsEditingCategory(false);
    };

    const handleSaveColors = async () => {
        if (editedColors.length === 0) {
            alert('Please add at least one color');
            return;
        }

        setIsSaving(true);
        const success = await onUpdate(item.id, { colors: editedColors });
        setIsSaving(false);

        if (success) {
            setIsEditingColors(false);
        }
    };

    const handleCancelColorsEdit = () => {
        setEditedColors(item.colors || []);
        setNewColor('');
        setIsEditingColors(false);
    };

    const handleAddColor = () => {
        const trimmedColor = newColor.trim();
        if (trimmedColor && !editedColors.includes(trimmedColor)) {
            setEditedColors([...editedColors, trimmedColor]);
            setNewColor('');
        }
    };

    const handleRemoveColor = (colorToRemove) => {
        setEditedColors(editedColors.filter(c => c !== colorToRemove));
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this item?')) {
            await onDelete(item.id, item.imagePath);
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="detail-modal card-glass" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose} title="Close">
                    <i className='bx bx-x'></i>
                </button>

                <div className="detail-modal-content">
                    <div className="detail-image-container">
                        {!imageLoaded && <div className="detail-image-skeleton"></div>}
                        <img
                            src={item.imageUrl}
                            alt={item.description}
                            className={`detail-image ${imageLoaded ? 'loaded' : ''}`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                        />
                    </div>

                    <div className="detail-info">
                        <div className="detail-header">
                            <div className="detail-category">
                                {isEditingCategory ? (
                                    <div className="edit-category-mode">
                                        <select
                                            value={editedCategory}
                                            onChange={(e) => setEditedCategory(e.target.value)}
                                            className="category-select"
                                        >
                                            <option value="top">Top</option>
                                            <option value="bottom">Bottom</option>
                                            <option value="shoes">Shoes</option>
                                            <option value="outerwear">Outerwear</option>
                                            <option value="dress">Dress</option>
                                            <option value="suit">Suit</option>
                                            <option value="accessory">Accessory</option>
                                        </select>
                                        <div className="edit-actions-inline">
                                            <button
                                                className="btn-icon-sm btn-primary-sm"
                                                onClick={handleSaveCategory}
                                                disabled={isSaving}
                                                title="Save"
                                            >
                                                <i className='bx bx-check'></i>
                                            </button>
                                            <button
                                                className="btn-icon-sm btn-ghost-sm"
                                                onClick={handleCancelCategoryEdit}
                                                disabled={isSaving}
                                                title="Cancel"
                                            >
                                                <i className='bx bx-x'></i>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <i className={`${categoryIcons[item.category] || 'bx bx-hanger'} category-icon`}></i>
                                        <span className="category-name">{item.category}</span>
                                        <button
                                            className="edit-btn-inline"
                                            onClick={() => setIsEditingCategory(true)}
                                            title="Edit category"
                                        >
                                            <i className='bx bx-pencil'></i>
                                        </button>
                                    </>
                                )}
                            </div>
                            {item.favorite && (
                                <div className="favorite-badge">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                    </svg>
                                    <span>Favorite</span>
                                </div>
                            )}
                            {item.inLaundry && (
                                <div className="laundry-badge-modal">
                                    <i className='bx bx-basket'></i>
                                    <span>In Laundry</span>
                                </div>
                            )}
                        </div>

                        <div className="detail-section">
                            <div className="section-header">
                                <h3>Description</h3>
                                {!isEditing && (
                                    <button
                                        className="edit-btn"
                                        onClick={() => setIsEditing(true)}
                                        title="Edit description"
                                    >
                                        <i className='bx bx-pencil'></i>
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="edit-mode">
                                    <textarea
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        className="description-input"
                                        rows="4"
                                        placeholder="Enter item description..."
                                        autoFocus
                                    />
                                    <div className="edit-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handleSaveDescription}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={handleCancelEdit}
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="detail-description">{item.description || 'No description'}</p>
                            )}
                        </div>

                        {(item.colors && item.colors.length > 0) || isEditingColors ? (
                            <div className="detail-section">
                                <div className="section-header">
                                    <h3>Colors</h3>
                                    {!isEditingColors && (
                                        <button
                                            className="edit-btn"
                                            onClick={() => setIsEditingColors(true)}
                                            title="Edit colors"
                                        >
                                            <i className='bx bx-pencil'></i>
                                        </button>
                                    )}
                                </div>

                                {isEditingColors ? (
                                    <div className="edit-mode">
                                        <div className="color-editor">
                                            <div className="color-input-group">
                                                <input
                                                    type="text"
                                                    value={newColor}
                                                    onChange={(e) => setNewColor(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
                                                    placeholder="Add a color..."
                                                    className="color-input"
                                                />
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={handleAddColor}
                                                    disabled={!newColor.trim()}
                                                >
                                                    <i className='bx bx-plus'></i> Add
                                                </button>
                                            </div>
                                            <div className="detail-colors">
                                                {editedColors.map((color, idx) => (
                                                    <span key={idx} className="color-tag-editable">
                                                        {color}
                                                        <button
                                                            className="remove-color-btn"
                                                            onClick={() => handleRemoveColor(color)}
                                                            title="Remove color"
                                                        >
                                                            <i className='bx bx-x'></i>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="edit-actions">
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={handleSaveColors}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={handleCancelColorsEdit}
                                                disabled={isSaving}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="detail-colors">
                                        {item.colors.map((color, idx) => (
                                            <span key={idx} className="color-tag-large">{color}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {Array.isArray(item.season) && item.season.length > 0 && (
                            <div className="detail-section">
                                <h3>Season</h3>
                                <div className="detail-tags">
                                    {item.season.map((s, idx) => (
                                        <span key={idx} className="tag">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {Array.isArray(item.style) && item.style.length > 0 && (
                            <div className="detail-section">
                                <h3>Style</h3>
                                <div className="detail-tags">
                                    {item.style.map((s, idx) => (
                                        <span key={idx} className="tag">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="detail-actions">
                            {onToggleLaundry && (
                                <button
                                    className={`btn btn-sm ${item.inLaundry ? 'btn-secondary' : 'btn-ghost'}`}
                                    onClick={() => onToggleLaundry(item.id, item.inLaundry)}
                                >
                                    <i className='bx bx-basket'></i>
                                    {item.inLaundry ? 'Mark as Clean' : 'Add to Laundry'}
                                </button>
                            )}
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={handleDelete}
                            >
                                <i className='bx bx-trash'></i> Delete Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
