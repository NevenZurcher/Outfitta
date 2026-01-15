import { useState, useEffect } from 'react';
import { outfitService } from '../../services/outfitService';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './OutfitHistory.css';

export default function OutfitHistory({ user }) {
    const [outfits, setOutfits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

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

    const filteredOutfits = filter === 'favorites'
        ? outfits.filter(outfit => outfit.favorite)
        : outfits;

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
                <p>{outfits.length} outfits generated</p>
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
                    <i className='bx bx-star'></i> Favorites
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
                {filteredOutfits.map(outfit => (
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
                            <button
                                onClick={() => toggleFavorite(outfit.id, outfit.favorite)}
                                className="favorite-btn"
                            >
                                <i className={`bx bx-star ${outfit.favorite ? 'favorite-filled' : ''}`}></i>
                            </button>
                        </div>

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
                    </div>
                ))}
            </div>
        </div>
    );
}
