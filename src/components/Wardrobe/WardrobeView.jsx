import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wardrobeService } from '../../services/wardrobeService';
import { authService } from '../../services/authService';
import ClothingCard from './ClothingCard';
import AddClothingItem from './AddClothingItem';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './WardrobeView.css';

export default function WardrobeView({ user }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadWardrobe();
    }, [user]);

    const loadWardrobe = async () => {
        setLoading(true);
        const result = await wardrobeService.getItems(user.uid);
        if (result.success) {
            setItems(result.items);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleItemAdded = () => {
        setShowAddModal(false);
        loadWardrobe();
    };

    const handleDelete = async (itemId, imagePath) => {
        if (confirm('Are you sure you want to delete this item?')) {
            const result = await wardrobeService.deleteItem(itemId, imagePath);
            if (result.success) {
                loadWardrobe();
            }
        }
    };

    const handleSignOut = async () => {
        await authService.signOut();
    };

    const handleToggleFavorite = async (itemId, currentStatus) => {
        const result = await wardrobeService.toggleFavorite(itemId, currentStatus);
        if (result.success) {
            loadWardrobe();
        }
    };

    const navigate = useNavigate();

    const handleGenerateWithItem = (item) => {
        navigate('/generate', { state: { anchorItem: item } });
    };

    const filteredItems = filter === 'all'
        ? items
        : filter === 'favorites'
            ? items.filter(item => item.favorite)
            : items.filter(item => item.category === filter);

    const categories = ['all', 'favorites', 'top', 'bottom', 'shoes', 'outerwear', 'dress', 'accessory'];

    if (loading) {
        return (
            <div className="wardrobe-loading">
                <LoadingSpinner message="Loading your wardrobe..." />
            </div>
        );
    }

    return (
        <div className="wardrobe-container">
            <header className="wardrobe-header">
                <div>
                    <h1 className="gradient-text">My Wardrobe</h1>
                    <p>{items.length} items</p>
                </div>
                <button onClick={handleSignOut} className="btn btn-ghost btn-icon" title="Sign Out">
                    <i className='bx bx-arrow-out-left-square-half'></i>
                </button>
            </header>

            <div className="filter-bar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`filter-btn ${filter === cat ? 'active' : ''}`}
                    >
                        {cat === 'favorites' ? <><i className='bx bx-star'></i> Favorites</> : cat}
                    </button>
                ))}
            </div>

            {error && <ErrorMessage message={error} onRetry={loadWardrobe} />}

            {filteredItems.length === 0 && !error && (
                <div className="empty-state">
                    <div className="empty-icon"><i className='bx bx-hanger'></i></div>
                    <h3>No items yet</h3>
                    <p>Add your first clothing item to get started!</p>
                </div>
            )}

            <div className="wardrobe-grid">
                {filteredItems.map(item => (
                    <ClothingCard
                        key={item.id}
                        item={item}
                        onDelete={() => handleDelete(item.id, item.imagePath)}
                        onToggleFavorite={() => handleToggleFavorite(item.id, item.favorite)}
                        onGenerateWithItem={() => handleGenerateWithItem(item)}
                    />
                ))}
            </div>

            <button
                onClick={() => setShowAddModal(true)}
                className="fab"
                title="Add clothing item"
            >
                +
            </button>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Clothing Item</h2>
                            <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-icon">
                                ✕
                            </button>
                        </div>
                        <AddClothingItem userId={user.uid} onSuccess={handleItemAdded} />
                    </div>
                </div>
            )}
        </div>
    );
}
