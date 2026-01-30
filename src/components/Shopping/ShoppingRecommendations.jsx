import { useState, useEffect } from 'react';
import { recommendationService } from '../../services/recommendationService';
import { wardrobeService } from '../../services/wardrobeService';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './ShoppingRecommendations.css';

export default function ShoppingRecommendations({ user }) {
    const [recommendations, setRecommendations] = useState([]);
    const [wardrobeAnalysis, setWardrobeAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [wardrobeItems, setWardrobeItems] = useState([]);

    useEffect(() => {
        loadWardrobe();
    }, [user]);

    const loadWardrobe = async () => {
        const result = await wardrobeService.getItems(user.uid);
        if (result.success) {
            setWardrobeItems(result.items);
            // Auto-generate recommendations on first load if wardrobe exists
            if (result.items.length > 0 && recommendations.length === 0) {
                generateRecommendations(result.items);
            }
        }
    };

    const generateRecommendations = async (items = wardrobeItems) => {
        setLoading(true);
        setError('');

        try {
            const result = await recommendationService.generateRecommendations(
                user.uid,
                items,
                8
            );

            if (result.success) {
                setRecommendations(result.recommendations);
                setWardrobeAnalysis(result.wardrobeAnalysis);
            } else {
                setError(result.error || 'Failed to generate recommendations');
            }
        } catch (err) {
            setError('Failed to generate recommendations. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecommendations = selectedCategory === 'all'
        ? recommendations
        : recommendations.filter(rec => rec.category === selectedCategory);

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    };

    const getCategoryIcon = (category) => {
        const icons = {
            top: 'bx-t-shirt',
            bottom: 'bx-been-here',
            shoes: 'bx-run',
            outerwear: 'bx-jacket',
            accessory: 'bx-diamond',
            dress: 'bx-female',
            suit: 'bx-briefcase'
        };
        return icons[category] || 'bx-shopping-bag';
    };

    return (
        <div className="shopping-recommendations-container">
            <header className="recommendations-header">
                <h1 className="gradient-text">Shopping Recommendations</h1>
                <p>AI-powered suggestions based on your wardrobe and style</p>
            </header>

            {wardrobeItems.length === 0 ? (
                <div className="empty-state card-glass">
                    <i className='bx bx-closet empty-icon'></i>
                    <h3>No Wardrobe Items Yet</h3>
                    <p>Add some items to your wardrobe first, and we'll suggest new pieces that complement your style!</p>
                </div>
            ) : (
                <>
                    {/* Wardrobe Analysis Summary */}
                    {wardrobeAnalysis && (
                        <div className="wardrobe-summary card-glass">
                            <h3><i className='bx bx-bar-chart-alt-2'></i> Your Wardrobe</h3>
                            <div className="summary-stats">
                                <div className="stat">
                                    <span className="stat-value">{wardrobeAnalysis.totalItems}</span>
                                    <span className="stat-label">Total Items</span>
                                </div>
                                {wardrobeAnalysis.missingCategories.length > 0 && (
                                    <div className="stat">
                                        <span className="stat-value">{wardrobeAnalysis.missingCategories.length}</span>
                                        <span className="stat-label">Missing Categories</span>
                                    </div>
                                )}
                                {wardrobeAnalysis.seasonalGaps.length > 0 && (
                                    <div className="stat">
                                        <span className="stat-value">{wardrobeAnalysis.seasonalGaps.length}</span>
                                        <span className="stat-label">Seasonal Gaps</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Category Filter */}
                    <div className="category-filter">
                        <button
                            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            All
                        </button>
                        {['top', 'bottom', 'shoes', 'outerwear', 'accessory', 'dress'].map(cat => (
                            <button
                                key={cat}
                                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                <i className={`bx ${getCategoryIcon(cat)}`}></i>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={() => generateRecommendations()}
                        className="btn btn-primary w-full generate-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <LoadingSpinner size="sm" message="Generating recommendations..." />
                        ) : (
                            <>
                                <i className='bx bx-refresh'></i>
                                {recommendations.length > 0 ? 'Refresh Recommendations' : 'Generate Recommendations'}
                            </>
                        )}
                    </button>

                    {error && <ErrorMessage message={error} onRetry={() => generateRecommendations()} />}

                    {/* Recommendations Grid */}
                    {filteredRecommendations.length > 0 && (
                        <div className="recommendations-grid">
                            {filteredRecommendations.map((rec, index) => (
                                <div key={index} className={`recommendation-card card-glass ${getPriorityColor(rec.priority)}`}>
                                    <div className="card-header">
                                        <div className="category-badge">
                                            <i className={`bx ${getCategoryIcon(rec.category)}`}></i>
                                            {rec.category}
                                        </div>
                                        {rec.priority && (
                                            <span className="priority-badge">{rec.priority}</span>
                                        )}
                                    </div>

                                    <h3 className="item-type">{rec.itemType}</h3>
                                    <p className="item-description">{rec.description}</p>

                                    <div className="item-details">
                                        {rec.suggestedColors && rec.suggestedColors.length > 0 && (
                                            <div className="detail-section">
                                                <span className="detail-label">
                                                    <i className='bx bx-palette'></i> Colors:
                                                </span>
                                                <div className="color-tags">
                                                    {rec.suggestedColors.map((color, i) => (
                                                        <span key={i} className="color-tag">{color}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {rec.suggestedStyle && rec.suggestedStyle.length > 0 && (
                                            <div className="detail-section">
                                                <span className="detail-label">
                                                    <i className='bx bx-star'></i> Style:
                                                </span>
                                                <span>{rec.suggestedStyle.join(', ')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="reasoning-section">
                                        <span className="reasoning-label">
                                            <i className='bx bx-bulb'></i> Why this item?
                                        </span>
                                        <p className="reasoning-text">{rec.reasoning}</p>
                                    </div>

                                    {rec.pairsWith && rec.pairsWith.length > 0 && (
                                        <div className="pairs-section">
                                            <span className="pairs-label">
                                                <i className='bx bx-link'></i> Pairs with:
                                            </span>
                                            <ul className="pairs-list">
                                                {rec.pairsWith.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && recommendations.length === 0 && !error && (
                        <div className="empty-recommendations card-glass">
                            <i className='bx bx-shopping-bag empty-icon'></i>
                            <p>Click "Generate Recommendations" to get personalized shopping suggestions!</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
