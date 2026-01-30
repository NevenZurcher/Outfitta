import { useState } from 'react';
import { wardrobeService } from '../../services/wardrobeService';
import LoadingSpinner from '../Common/LoadingSpinner';
import './BulkUploadModal.css';

export default function BulkUploadModal({ user, onClose, onSuccess }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [detectedItems, setDetectedItems] = useState([]);
    const [currentStep, setCurrentStep] = useState('select'); // select, analyzing, review, saving, results
    const [progress, setProgress] = useState(null);
    const [results, setResults] = useState(null);
    const [editingItemIndex, setEditingItemIndex] = useState(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        setDetectedItems([]);
        setCurrentStep('select');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );
        setSelectedFiles(files);
        setDetectedItems([]);
        setCurrentStep('select');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
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
                // Handle case where nothing was detected even after analysis
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
            setCurrentStep('results'); // Show error state
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
                user.uid,
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
                // Auto-close after 2 seconds if successful
                setTimeout(() => {
                    onSuccess();
                    onClose();
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
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const handleRemoveDetectedItem = (index) => {
        setDetectedItems(detectedItems.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index, field, value) => {
        const updated = [...detectedItems];
        updated[index] = { ...updated[index], [field]: value };
        setDetectedItems(updated);
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`bulk-upload-modal card-glass step-${currentStep}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        {currentStep === 'select' ? 'Bulk Upload' :
                            currentStep === 'review' ? 'Review Detected Items' :
                                currentStep === 'results' ? 'Upload Complete' : 'Processing...'}
                    </h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <i className='bx bx-x'></i>
                    </button>
                </div>

                <div className="modal-content">
                    {/* Step 1: File Selection */}
                    {currentStep === 'select' && (
                        <>
                            <div
                                className="drop-zone"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => document.getElementById('bulk-file-input').click()}
                            >
                                <i className='bx bx-cloud-upload'></i>
                                <p>Drop images here or click to browse</p>
                                <p className="drop-zone-hint">Select multiple files at once</p>
                                <input
                                    id="bulk-file-input"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {selectedFiles.length > 0 && (
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
                                        <span className="stat-value">{results.totalItemsDetected}</span>
                                        <span className="stat-label">Items Reviewed</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{results.totalItemsAdded}</span>
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
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="modal-actions">
                    {currentStep === 'select' && (
                        <>
                            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAnalyze}
                                disabled={selectedFiles.length === 0}
                            >
                                <i className='bx bx-search-alt'></i> Analyze {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                            </button>
                        </>
                    )}
                    {currentStep === 'review' && (
                        <>
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
                        </>
                    )}
                    {(currentStep === 'results') && (
                        <button className="btn btn-primary" onClick={() => { onSuccess(); onClose(); }}>
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
