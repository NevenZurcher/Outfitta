import { useState, useRef } from 'react';
import { wardrobeService } from '../../services/wardrobeService';
import LoadingSpinner from '../Common/LoadingSpinner';
import './AddClothingItem.css';

export default function AddClothingItem({ userId, onSuccess }) {
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            setError('Please select an image');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await wardrobeService.addItem(userId, imageFile);
            if (result.success) {
                // Show notification if multiple items were detected
                if (result.detectedCount > 1) {
                    alert(`✨ Detected ${result.detectedCount} items in this image! Only the first item was added. Use "Bulk Upload" to add all items at once.`);
                }
                onSuccess();
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to add item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-item-form">
            <div className="upload-area">
                {preview ? (
                    <div className="preview-container">
                        <img src={preview} alt="Preview" className="preview-image" />
                        <button
                            type="button"
                            onClick={() => {
                                setImageFile(null);
                                setPreview(null);
                            }}
                            className="btn btn-secondary"
                        >
                            Change Image
                        </button>
                    </div>
                ) : (
                    <div
                        className="upload-placeholder"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="upload-icon">📷</div>
                        <p>Tap to upload or take a photo</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}
            </div>

            {error && <div className="error-text">{error}</div>}

            <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading || !imageFile}
            >
                {loading ? (
                    <LoadingSpinner size="sm" message="Analyzing with AI..." />
                ) : (
                    'Add to Wardrobe'
                )}
            </button>

            <p className="ai-notice">
                ✨ AI will automatically analyze your clothing item
            </p>
        </form>
    );
}
