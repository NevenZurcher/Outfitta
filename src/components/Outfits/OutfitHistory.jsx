import { useState, useEffect } from 'react';
import { outfitService } from '../../services/outfitService';
import { preferencesService } from '../../services/preferencesService';
import OutfitCollage from './OutfitCollage';
import StarRating from '../Common/StarRating';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import Pagination from '../Common/Pagination';
import './OutfitHistory.css';

export default function OutfitHistory({ user }) {
    const [outfits, setOutfits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const outfitsPerPage = 6;

    useEffect(() => {
        loadHistory();
    }, [user]);

    const loadHistory = async () => {
        setLoading(true);
        const result = await outfitService.getOutfitHistory(user.uid);
        if (result.success) {
            setOutfits(result.outfits);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const toggleFavorite = async (outfitId, currentStatus) => {
        const result = await outfitService.toggleFavorite(outfitId, currentStatus);
        if (result.success) {
            loadHistory();
        }
    };

    const handleRating = async (outfitId, rating) => {
        // Update outfit rating
        const result = await outfitService.rateOutfit(outfitId, rating);
        if (result.success) {
            // Find the outfit to get its data
            const outfit = outfits.find(o => o.id === outfitId);
            if (outfit) {
                // Update user preferences based on rating
                await preferencesService.updatePreferences(user.uid, outfit, rating);
            }
            // Reload to show updated rating
            loadHistory();
        }
    };

    const handleDelete = async (outfitId) => {
        if (confirm('Are you sure you want to delete this outfit? This action cannot be undone.')) {
            // Optimistically remove from UI
            setOutfits(prevOutfits => prevOutfits.filter(o => o.id !== outfitId));

            const result = await outfitService.deleteOutfit(outfitId);

            if (!result.success) {
                console.error('Failed to delete outfit, reverting UI');
                loadHistory(); // Reload to restore state
                alert('Failed to delete outfit: ' + result.error);
            }
        }
    };

    const filteredOutfits = filter === 'all'
        ? outfits
        : filter === 'favorites'
            ? outfits.filter(outfit => outfit.favorite)
            : filter === 'rated'
                ? outfits.filter(outfit => outfit.rating)
                : filter === 'unrated'
                    ? outfits.filter(outfit => !outfit.rating)
                    : outfits;

    // Pagination calculations
    const totalPages = Math.ceil(filteredOutfits.length / outfitsPerPage);
    const startIndex = (currentPage - 1) * outfitsPerPage;
    const endIndex = startIndex + outfitsPerPage;
    const paginatedOutfits = filteredOutfits.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="history-loading">
                <LoadingSpinner message="Loading outfit history..." />
            </div>
        );
    }

    return (
        <div className="history-container">
            <header className="history-header">
                <h1 className="gradient-text">Outfit History</h1>
                <p>{outfits.length} outfits generated {filteredOutfits.length !== outfits.length && `(${filteredOutfits.length} filtered)`}</p>
            </header>

            <div className="filter-bar">
                <button
                    onClick={() => setFilter('all')}
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('favorites')}
                    className={`filter-btn ${filter === 'favorites' ? 'active' : ''}`}
                >
                    <i className='bx bx-heart'></i> Favorites
                </button>
                <button
                    onClick={() => setFilter('rated')}
                    className={`filter-btn ${filter === 'rated' ? 'active' : ''}`}
                >
                    <i className='bx bxs-star'></i> Rated
                </button>
                <button
                    onClick={() => setFilter('unrated')}
                    className={`filter-btn ${filter === 'unrated' ? 'active' : ''}`}
                >
                    <i className='bx bx-star-half'></i> Unrated
                </button>
            </div>

            {error && <ErrorMessage message={error} onRetry={loadHistory} />}

            {filteredOutfits.length === 0 && !error && (
                <div className="empty-state">
                    <div className="empty-icon">✨</div>
                    <h3>No outfits yet</h3>
                    <p>Generate your first outfit to see it here!</p>
                </div>
            )}

            <div className="history-list">
                {paginatedOutfits.map(outfit => (
                    <div key={outfit.id} className="history-card card-glass">
                        <div className="card-header">
                            <div>
                                {outfit.occasion && (
                                    <span className="occasion-badge">{outfit.occasion}</span>
                                )}
                                <div className="outfit-date">
                                    {outfit.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                                </div>
                            </div>
                            <div className="card-actions">
                                <button
                                    onClick={() => handleDelete(outfit.id)}
                                    className="delete-btn"
                                    title="Delete outfit"
                                >
                                    <i className='bx bx-trash'></i>
                                </button>
                                <button
                                    onClick={() => toggleFavorite(outfit.id, outfit.favorite)}
                                    className="favorite-btn"
                                    title={outfit.favorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                    <i className={`bx ${outfit.favorite ? 'bxs-heart favorite-filled' : 'bx-heart'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Display collage of selected items */}
                        {outfit.selectedItems && outfit.selectedItems.length > 0 && (
                            <OutfitCollage selectedItems={outfit.selectedItems} />
                        )}

                        {outfit.imageUrl && (
                            <div className="outfit-image-preview">
                                <img src={outfit.imageUrl} alt="Outfit visualization" />
                            </div>
                        )}

                        {outfit.weather && (
                            <div className="outfit-weather">
                                🌤️ {outfit.weather.temp}°F - {outfit.weather.condition}
                            </div>
                        )}

                        {outfit.aiSuggestion && (
                            <div className="outfit-details">
                                {outfit.aiSuggestion.outfit?.top && (
                                    <div className="detail-item">
                                        <span className="detail-label">Top:</span>
                                        <span>{outfit.aiSuggestion.outfit.top}</span>
                                    </div>
                                )}
                                {outfit.aiSuggestion.outfit?.bottom && (
                                    <div className="detail-item">
                                        <span className="detail-label">Bottom:</span>
                                        <span>{outfit.aiSuggestion.outfit.bottom}</span>
                                    </div>
                                )}
                                {outfit.aiSuggestion.outfit?.shoes && (
                                    <div className="detail-item">
                                        <span className="detail-label">Shoes:</span>
                                        <span>{outfit.aiSuggestion.outfit.shoes}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {outfit.aiSuggestion?.reasoning && (
                            <div className="outfit-reasoning">
                                <strong>Why it works:</strong> {outfit.aiSuggestion.reasoning}
                            </div>
                        )}

                        <div className="card-footer">
                            <span className="rating-prompt">Rate this outfit:</span>
                            <StarRating
                                rating={outfit.rating}
                                onRate={(rating) => handleRating(outfit.id, rating)}
                                size="md"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
