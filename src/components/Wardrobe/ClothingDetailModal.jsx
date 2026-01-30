import { useState, useEffect } from 'react';
import './ClothingDetailModal.css';

export default function ClothingDetailModal({ item, onClose, onUpdate, onDelete, onToggleLaundry }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState(item.description || '');
    const [isSaving, setIsSaving] = useState(false);

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
                        <img src={item.imageUrl} alt={item.description} className="detail-image" />
                    </div>

                    <div className="detail-info">
                        <div className="detail-header">
                            <div className="detail-category">
                                <i className={`${categoryIcons[item.category] || 'bx bx-hanger'} category-icon`}></i>
                                <span className="category-name">{item.category}</span>
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

                        {item.colors && item.colors.length > 0 && (
                            <div className="detail-section">
                                <h3>Colors</h3>
                                <div className="detail-colors">
                                    {item.colors.map((color, idx) => (
                                        <span key={idx} className="color-tag-large">{color}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {item.season && item.season.length > 0 && (
                            <div className="detail-section">
                                <h3>Season</h3>
                                <div className="detail-tags">
                                    {item.season.map((s, idx) => (
                                        <span key={idx} className="tag">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {item.style && item.style.length > 0 && (
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
