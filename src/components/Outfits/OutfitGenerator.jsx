import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { wardrobeService } from '../../services/wardrobeService';
import { outfitService } from '../../services/outfitService';
import { weatherService } from '../../services/weatherService';
import { geminiService } from '../../services/geminiService';
import ClothingCard from '../Wardrobe/ClothingCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import './OutfitGenerator.css';

export default function OutfitGenerator({ user }) {
    const [wardrobeItems, setWardrobeItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [weather, setWeather] = useState(null);
    const [occasion, setOccasion] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingWeather, setLoadingWeather] = useState(false);
    const [generatedOutfit, setGeneratedOutfit] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [currentOutfitId, setCurrentOutfitId] = useState(null);
    const [showAllAnchorItems, setShowAllAnchorItems] = useState(false);
    const [error, setError] = useState('');

    const location = useLocation();

    useEffect(() => {
        loadWardrobe();
    }, [user]);

    useEffect(() => {
        // Check if an anchor item was passed via navigation
        if (location.state?.anchorItem) {
            setSelectedItems([location.state.anchorItem]);
            // Clear the state so it doesn't persist on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const loadWardrobe = async () => {
        const result = await wardrobeService.getItems(user.uid);
        if (result.success) {
            // Sort items: favorites first, then by creation date
            const sortedItems = result.items.sort((a, b) => {
                if (a.favorite && !b.favorite) return -1;
                if (!a.favorite && b.favorite) return 1;
                return 0;
            });
            setWardrobeItems(sortedItems);
        }
    };

    const getWeather = async () => {
        setLoadingWeather(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const weatherData = await weatherService.getWeatherByCoords(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    setWeather(weatherData);
                    setLoadingWeather(false);
                },
                () => {
                    setLoadingWeather(false);
                    alert('Unable to get location. Please enable location services.');
                }
            );
        } else {
            setLoadingWeather(false);
            alert('Geolocation is not supported by your browser.');
        }
    };

    const handleGenerate = async () => {
        if (wardrobeItems.length === 0) {
            setError('Add some items to your wardrobe first!');
            return;
        }

        setLoading(true);
        setError('');
        setGeneratedOutfit(null);
        setGeneratedImage(null);

        try {
            const constraints = {
                weather,
                occasion,
                anchorItem: selectedItems.length > 0 ? selectedItems[0] : null
            };

            const result = await outfitService.generateOutfit(
                user.uid,
                wardrobeItems,
                constraints
            );

            if (result.success) {
                setGeneratedOutfit(result.outfit);
                setCurrentOutfitId(result.id); // Save outfit ID for later image update

                // Generate visual representation if visualPrompt exists
                if (result.outfit.visualPrompt) {
                    generateVisual(result.outfit.visualPrompt, result.id);
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to generate outfit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateVisual = async (prompt, outfitId) => {
        console.log('Starting image generation for outfit:', outfitId);
        setGeneratingImage(true);
        try {
            const imageData = await geminiService.generateOutfitImage(prompt);
            console.log('Image generated:', imageData ? 'Success' : 'Failed');

            if (imageData) {
                setGeneratedImage(imageData);

                // Save image to outfit history
                if (outfitId) {
                    console.log('Saving image to outfit:', outfitId);
                    const result = await outfitService.updateOutfitImage(outfitId, imageData);
                    console.log('Image save result:', result);
                } else {
                    console.warn('No outfit ID provided, image not saved');
                }
            }
        } catch (err) {
            console.error("Image generation failed:", err);
        } finally {
            setGeneratingImage(false);
        }
    };

    const toggleItemSelection = (item) => {
        setSelectedItems(prev => {
            const isSelected = prev.find(i => i.id === item.id);
            if (isSelected) {
                return prev.filter(i => i.id !== item.id);
            } else {
                return [item]; // Only allow one anchor item
            }
        });
    };

    return (
        <div className="outfit-generator-container">
            <header className="generator-header">
                <h1 className="gradient-text">Generate Outfit</h1>
                <p>Let AI create the perfect outfit for you</p>
            </header>

            <div className="generator-controls">
                <div className="control-section">
                    <h3>Weather</h3>
                    {weather ? (
                        <div className="weather-card card-glass">
                            <div className="weather-info">
                                <div className="weather-temp">{weather.temp}°F</div>
                                <div className="weather-condition">{weather.condition}</div>
                                <div className="weather-location">{weather.location}</div>
                            </div>
                            <button onClick={getWeather} className="btn btn-ghost btn-icon">
                                <i className='bx bx-rotate-ccw'></i>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={getWeather}
                            className="btn btn-secondary w-full"
                            disabled={loadingWeather}
                        >
                            {loadingWeather ? <LoadingSpinner size="sm" /> : <><i className='bx bx-sun'></i> Get Current Weather</>}
                        </button>
                    )}
                </div>

                <div className="control-section">
                    <h3>Occasion</h3>
                    <select
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        className="input"
                    >
                        <option value="">Any occasion</option>
                        <option value="casual">Casual</option>
                        <option value="work">Work/Professional</option>
                        <option value="formal">Formal Event</option>
                        <option value="date">Date Night</option>
                        <option value="workout">Workout</option>
                        <option value="party">Party</option>
                    </select>
                </div>

                <div className="control-section">
                    <h3>Anchor Piece (Optional)</h3>
                    <p className="section-description">Select one item to build the outfit around</p>
                    <div className="anchor-grid">
                        {(showAllAnchorItems ? wardrobeItems : wardrobeItems.slice(0, 6)).map(item => (
                            <ClothingCard
                                key={item.id}
                                item={item}
                                onSelect={() => toggleItemSelection(item)}
                                selected={selectedItems.find(i => i.id === item.id)}
                            />
                        ))}
                    </div>
                    {wardrobeItems.length > 6 && (
                        <button
                            onClick={() => setShowAllAnchorItems(!showAllAnchorItems)}
                            className="btn btn-ghost btn-sm show-more-btn"
                        >
                            {showAllAnchorItems ? '▲ Show Less' : `▼ Show More (${wardrobeItems.length - 6} more)`}
                        </button>
                    )}
                </div>
            </div>

            <button
                onClick={handleGenerate}
                className="btn btn-primary w-full generate-btn"
                disabled={loading}
            >
                {loading ? <LoadingSpinner size="sm" message="Creating outfit..." /> : <><i className='bx bx-sparkles'></i> Generate Outfit</>}
            </button>

            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}

            {generatedOutfit && (
                <div className="outfit-result card-glass animate-fade-in">
                    <h2>Your Outfit</h2>

                    {(generatingImage || generatedImage) && (
                        <div className="outfit-visualization">
                            {generatingImage ? (
                                <div className="generating-visual">
                                    <LoadingSpinner size="md" />
                                    <p>Generating visual with AI...</p>
                                </div>
                            ) : generatedImage ? (
                                <div className="generated-image-container">
                                    <img src={generatedImage} alt="AI Generated Outfit Visualization" className="generated-image" />
                                    <div className="image-badge"><i className='bx bx-sparkles'></i> AI Generated</div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className="outfit-items">
                        {generatedOutfit.outfit.top && (
                            <div className="outfit-item">
                                <span className="item-label">Top:</span>
                                <span>{generatedOutfit.outfit.top}</span>
                            </div>
                        )}
                        {generatedOutfit.outfit.bottom && (
                            <div className="outfit-item">
                                <span className="item-label">Bottom:</span>
                                <span>{generatedOutfit.outfit.bottom}</span>
                            </div>
                        )}
                        {generatedOutfit.outfit.shoes && (
                            <div className="outfit-item">
                                <span className="item-label">Shoes:</span>
                                <span>{generatedOutfit.outfit.shoes}</span>
                            </div>
                        )}
                        {generatedOutfit.outfit.outerwear && (
                            <div className="outfit-item">
                                <span className="item-label">Outerwear:</span>
                                <span>{generatedOutfit.outfit.outerwear}</span>
                            </div>
                        )}
                        {generatedOutfit.outfit.accessories && generatedOutfit.outfit.accessories.length > 0 && (
                            <div className="outfit-item">
                                <span className="item-label">Accessories:</span>
                                <span>{generatedOutfit.outfit.accessories.join(', ')}</span>
                            </div>
                        )}
                    </div>

                    {generatedOutfit.reasoning && (
                        <div className="outfit-section">
                            <h3>Why This Works</h3>
                            <p>{generatedOutfit.reasoning}</p>
                        </div>
                    )}

                    {generatedOutfit.tips && (
                        <div className="outfit-section">
                            <h3>Styling Tips</h3>
                            <p>{generatedOutfit.tips}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
