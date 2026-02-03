import { useState, useRef } from 'react';
import { wardrobeService } from '../../services/wardrobeService';
import LoadingSpinner from '../Common/LoadingSpinner';
import './AddClothingItem.css';

export default function AddClothingItem({ userId, onSuccess }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [preview, setPreview] = useState(null);
    const [detectedItems, setDetectedItems] = useState([]);
    const [currentStep, setCurrentStep] = useState('select'); // select, analyzing, review, saving, results
    const [progress, setProgress] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;

        setSelectedFiles(files);
        setError('');
        
        // For single file, show preview immediately
        if (files.length === 1) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(files[0]);
            setCurrentStep('select');
        } else {
            // For multiple files, stay in select mode
            setPreview(null);
            setCurrentStep('select');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );
        
        if (files.length === 0) return;

        setSelectedFiles(files);
        setError('');
        setDetectedItems([]);
        setCurrentStep('select');
        
        if (files.length === 1) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(files[0]);
        } else {
            setPreview(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmitSingle = async (e) => {
        e.preventDefault();
        if (selectedFiles.length !== 1) return;

        setLoading(true);
        setError('');

        try {
            const result = await wardrobeService.addItem(userId, selectedFiles[0]);
            if (result.success) {
                if (result.detectedCount > 1) {
                    alert(`✨ Detected ${result.detectedCount} items in this image! Only the first item was added. Upload multiple files to add all items at once.`);
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

    const handleAnalyze = async () => {
        if (selectedFiles.length === 0) return;

        setCurrentStep('analyzing');
        setProgress({ current: 0, total: selectedFiles.length, status: 'Starting analysis...' });

        try {
            const analysisResult = await wardrobeService.analyzeImages(
                selectedFiles,
                (progressData) => {
                    setProgress({
                        current: progressData.currentFile,
                        total: progressData.totalFiles,
                        fileName: progressData.fileName,
                        status: progressData.status,
                        detectedCount: progressData.detectedCount,
                        error: progressData.error
                    });
                }
            );

            if (analysisResult.success || analysisResult.detectedItems.length > 0) {
                setDetectedItems(analysisResult.detectedItems);
                setCurrentStep('review');
            } else {
                setCurrentStep('results');
                setResults({
                    success: false,
                    totalFiles: selectedFiles.length,
                    totalItemsAdded: 0,
                    totalItemsDetected: 0,
                    errors: [{ fileName: 'General', error: 'No clothing items detected in uploaded images.' }]
                });
            }
        } catch (error) {
            console.error('Error during analysis:', error);
            setCurrentStep('results');
            setResults({
                success: false,
                totalFiles: selectedFiles.length,
                errors: [{ fileName: 'System', error: error.message }]
            });
        }
    };

    const handleSaveAll = async () => {
        if (detectedItems.length === 0) return;

        setCurrentStep('saving');
        setProgress({ current: 0, total: detectedItems.length, status: 'Saving items...' });

        try {
            const saveResult = await wardrobeService.saveMultipleItems(
                userId,
                detectedItems,
                (progressData) => {
                    setProgress({
                        current: progressData.current,
                        total: progressData.total,
                        fileName: progressData.fileName || 'Item',
                        status: progressData.status,
                    });
                }
            );

            setResults({
                ...saveResult,
                totalItemsDetected: detectedItems.length,
                totalItemsAdded: saveResult.savedItems.length
            });
            setCurrentStep('results');

            if (saveResult.success) {
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }

        } catch (error) {
            console.error('Error saving items:', error);
            setCurrentStep('results');
            setResults({
                success: false,
                errors: [{ fileName: 'Save Error', error: error.message }]
            });
        }
    };

    const handleRemoveFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        
        if (newFiles.length === 0) {
            setPreview(null);
        } else if (newFiles.length === 1) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(newFiles[0]);
        }
    };

    const handleRemoveDetectedItem = (index) => {
        setDetectedItems(detectedItems.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index, field, value) => {
        const updated = [...detectedItems];
        updated[index] = { ...updated[index], [field]: value };
        setDetectedItems(updated);
    };

    const handleReset = () => {
        setSelectedFiles([]);
        setPreview(null);
        setDetectedItems([]);
        setCurrentStep('select');
        setProgress(null);
        setResults(null);
        setError('');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'analyzing': return '🔍';
            case 'detected': return '✅';
            case 'saving': return '💾';
            case 'completed': return '🎉';
            case 'error': return '❌';
            case 'uploading': return '☁️';
            default: return '⏳';
        }
    };

    const isSingleFile = selectedFiles.length === 1;
    const isMultipleFiles = selectedFiles.length > 1;

    // Single file upload UI
    if (isSingleFile && currentStep === 'select') {
        return (
            <form onSubmit={handleSubmitSingle} className="add-item-form">
                <div className="upload-area">
                    {preview ? (
                        <div className="preview-container">
                            <img src={preview} alt="Preview" className="preview-image" />
                            <button
                                type="button"
                                onClick={handleReset}
                                className="btn btn-secondary"
                            >
                                Change Image
                            </button>
                        </div>
                    ) : (
                        <div
                            className="upload-placeholder"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <div className="upload-icon">📷</div>
                            <p>Tap to upload or take a photo</p>
                            <p className="upload-hint">Or select multiple files for bulk upload</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
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
                    disabled={loading || !selectedFiles.length}
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

    // Multi-file upload UI
    return (
        <div className="bulk-upload-container">
            {/* Step 1: File Selection */}
            {currentStep === 'select' && (
                <>
                    <div
                        className="drop-zone"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <i className='bx bx-cloud-upload'></i>
                        <p>Drop images here or click to browse</p>
                        <p className="drop-zone-hint">Select multiple files at once</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {isMultipleFiles && (
                        <div className="selected-files">
                            <h3>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</h3>
                            <div className="files-grid">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="file-preview">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                        />
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => handleRemoveFile(index)}
                                        >
                                            <i className='bx bx-x'></i>
                                        </button>
                                        <span className="file-name">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bulk-actions">
                                <button className="btn btn-ghost" onClick={handleReset}>Clear All</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAnalyze}
                                >
                                    <i className='bx bx-search-alt'></i> Analyze ({selectedFiles.length})
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 2: Analyzing / Saving Progress */}
            {(currentStep === 'analyzing' || currentStep === 'saving') && progress && (
                <div className="upload-progress">
                    <h3>{currentStep === 'analyzing' ? 'Analyzing Images...' : 'Saving to Wardrobe...'}</h3>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                    </div>
                    <p className="progress-text">
                        {getStatusIcon(progress.status)} {progress.current} of {progress.total} - {progress.fileName || progress.itemDesc}
                    </p>
                    {progress.detectedCount && (
                        <p className="detected-count">
                            Found {progress.detectedCount} item{progress.detectedCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            )}

            {/* Step 3: Review Detected Items */}
            {currentStep === 'review' && (
                <div className="review-items">
                    <div className="review-header">
                        <p>Found {detectedItems.length} items. Review and edit before saving.</p>
                    </div>
                    <div className="detected-items-grid">
                        {detectedItems.map((item, index) => (
                            <div key={index} className="detected-item-card">
                                <div className="item-image">
                                    <img src={URL.createObjectURL(item.originalFile)} alt={item.description} />
                                    <button
                                        className="remove-item-btn"
                                        onClick={() => handleRemoveDetectedItem(index)}
                                        title="Remove this item"
                                    >
                                        <i className='bx bx-trash'></i>
                                    </button>
                                </div>
                                <div className="item-details-edit">
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={item.category}
                                            onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                                        >
                                            {['top', 'bottom', 'shoes', 'outerwear', 'dress', 'accessory'].map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={item.description}
                                            onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="confidence-badge">
                                        Confirm: {Math.round((item.confidence || 0) * 100)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bulk-actions">
                        <button className="btn btn-ghost" onClick={() => {
                            setDetectedItems([]);
                            setCurrentStep('select');
                        }}>Back</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveAll}
                            disabled={detectedItems.length === 0}
                        >
                            <i className='bx bx-save'></i> Save {detectedItems.length} Items to Wardrobe
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Results */}
            {currentStep === 'results' && results && (
                <div className="upload-results">
                    <div className="results-summary">
                        <h3>
                            {results.success ? '✅ Upload Complete!' : '⚠️ Upload Completed with Errors'}
                        </h3>
                        <div className="results-stats">
                            <div className="stat">
                                <span className="stat-value">{results.totalItemsDetected || 0}</span>
                                <span className="stat-label">Items Reviewed</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{results.totalItemsAdded || 0}</span>
                                <span className="stat-label">Items Added</span>
                            </div>
                        </div>
                        {results.errors && results.errors.length > 0 && (
                            <div className="errors-list">
                                <h4>Errors:</h4>
                                {results.errors.map((err, idx) => (
                                    <p key={idx} className="error-item">
                                        {err.fileName || err.itemDesc}: {err.error}
                                    </p>
                                ))}
                            </div>
                        )}
                        <button className="btn btn-primary" onClick={handleReset} style={{ marginTop: 'var(--spacing-lg)' }}>
                            Upload More
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
