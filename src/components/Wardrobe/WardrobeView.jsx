import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wardrobeService } from '../../services/wardrobeService';
import { authService } from '../../services/authService';
import ClothingCard from './ClothingCard';
import ClothingDetailModal from './ClothingDetailModal';
import AddClothingItem from './AddClothingItem';
import BulkUploadModal from './BulkUploadModal';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import Pagination from '../Common/Pagination';
import './WardrobeView.css';

export default function WardrobeView({ user }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [filter, setFilter] = useState('all');
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        loadWardrobe();
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showUploadMenu && !e.target.closest('.fab-container')) {
                setShowUploadMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showUploadMenu]);

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
            // Optimistically remove from UI immediately
            setItems(prevItems => prevItems.filter(item => item.id !== itemId));

            const result = await wardrobeService.deleteItem(itemId, imagePath);

            // If API call fails, revert the change (optional, but good practice)
            if (!result.success) {
                console.error('Failed to delete item, reverting UI');
                loadWardrobe(); // Reload to restore state
                alert('Failed to delete item: ' + result.error);
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

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const handleUpdateDescription = async (itemId, updates) => {
        // Handle both old signature (string) and new signature (object)
        const updateData = typeof updates === 'string'
            ? { description: updates }
            : updates;

        const result = await wardrobeService.updateItem(itemId, updateData);
        if (result.success) {
            loadWardrobe();
            // Update the selected item to reflect changes
            setSelectedItem(prev => prev ? { ...prev, ...updateData } : null);
            return true;
        }
        return false;
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
    };

    const handleToggleLaundry = async (itemId, currentStatus) => {
        const result = await wardrobeService.toggleLaundry(itemId, currentStatus);
        if (result.success) {
            loadWardrobe();
        }
    };

    const filteredItems = filter === 'all'
        ? items
        : filter === 'favorites'
            ? items.filter(item => item.favorite)
            : filter === 'clean'
                ? items.filter(item => !item.inLaundry)
                : filter === 'laundry'
                    ? items.filter(item => item.inLaundry)
                    : items.filter(item => item.category === filter);

    // Pagination calculations
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const categories = ['all', 'clean', 'laundry', 'favorites', 'top', 'bottom', 'shoes', 'outerwear', 'dress', 'accessory'];

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
                    <p>{items.length} items {filteredItems.length !== items.length && `(${filteredItems.length} filtered)`}</p>
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
                        {cat === 'favorites' ? <><i className='bx bx-heart'></i> Favorites</> :
                            cat === 'clean' ? <><i className='bx bx-check-circle'></i> Clean</> :
                                cat === 'laundry' ? <><i className='bx bx-basket'></i> In Laundry</> :
                                    cat}
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
                {paginatedItems.map(item => (
                    <ClothingCard
                        key={item.id}
                        item={item}
                        onDelete={() => handleDelete(item.id, item.imagePath)}
                        onToggleFavorite={() => handleToggleFavorite(item.id, item.favorite)}
                        onGenerateWithItem={() => handleGenerateWithItem(item)}
                        onViewDetails={() => handleViewDetails(item)}
                        onToggleLaundry={() => handleToggleLaundry(item.id, item.inLaundry)}
                    />
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            <div className="fab-container">
                {showUploadMenu && (
                    <div className="fab-menu">
                        <button
                            className="fab-menu-item"
                            onClick={() => {
                                setShowAddModal(true);
                                setShowUploadMenu(false);
                            }}
                        >
                            <i className='bx bx-plus'></i>
                            <span>Single Upload</span>
                        </button>
                        <button
                            className="fab-menu-item"
                            onClick={() => {
                                setShowBulkUploadModal(true);
                                setShowUploadMenu(false);
                            }}
                        >
                            <i className='bx bx-upload'></i>
                            <span>Bulk Upload</span>
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                    className={`fab ${showUploadMenu ? 'active' : ''}`}
                    title="Add clothing item"
                >
                    {showUploadMenu ? '✕' : '+'}
                </button>
            </div>

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

            {showDetailModal && selectedItem && (
                <ClothingDetailModal
                    item={selectedItem}
                    onClose={handleCloseDetailModal}
                    onUpdate={handleUpdateDescription}
                    onDelete={handleDelete}
                    onToggleLaundry={handleToggleLaundry}
                />
            )}

            {showBulkUploadModal && (
                <BulkUploadModal
                    user={user}
                    onClose={() => setShowBulkUploadModal(false)}
                    onSuccess={loadWardrobe}
                />
            )}
        </div>
    );
}
