import { useState } from 'react';
import { userProfileService } from '../../services/userProfileService';
import { STYLE_OPTIONS, COLOR_OPTIONS, GENDER_OPTIONS } from '../../constants';
import LoadingSpinner from '../Common/LoadingSpinner';
import './SetupWizard.css';

export default function SetupWizard({ user, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        gender: '',
        stylePreferences: [],
        favoriteColors: [],
        sizes: {
            top: '',
            bottom: '',
            shoes: ''
        },
        location: ''
    });

    const steps = [
        { id: 'welcome', title: 'Welcome!', optional: false },
        { id: 'gender', title: 'Gender', optional: true },
        { id: 'style', title: 'Style Preferences', optional: false },
        { id: 'colors', title: 'Favorite Colors', optional: true },
        { id: 'sizes', title: 'Sizes', optional: true },
        { id: 'location', title: 'Location', optional: true }
    ];

    const handleNext = async () => {
        // Save current step data
        if (currentStep > 0) {
            await userProfileService.saveSetupStep(user.uid, formData);
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            await handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);

        // Save final data
        await userProfileService.updateUserProfile(user.uid, formData);
        await userProfileService.completeSetup(user.uid);

        setLoading(false);
        onComplete();
    };

    const toggleArrayItem = (array, item) => {
        if (array.includes(item)) {
            return array.filter(i => i !== item);
        }
        return [...array, item];
    };

    const renderStep = () => {
        const step = steps[currentStep];

        switch (step.id) {
            case 'welcome':
                return (
                    <div className="step-content welcome-step">
                        <div className="welcome-icon">
                            <i className='bx bx-hanger'></i>
                        </div>
                        <h2>Welcome to Outfitta!</h2>
                        <p>Let's set up your profile to get personalized outfit recommendations.</p>
                        <p className="welcome-subtext">This will only take a minute.</p>
                    </div>
                );

            case 'gender':
                return (
                    <div className="step-content">
                        <h3 className="step-category">GENDER</h3>
                        <h2>
                            <i className='bx bx-user header-icon'></i>
                            What's your gender?
                        </h2>
                        <p className="step-description">This helps us provide better recommendations</p>
                        <div className="option-grid">
                            {GENDER_OPTIONS.map(option => (
                                <button
                                    key={option}
                                    className={`option-btn ${formData.gender === option ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, gender: option })}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'style':
                return (
                    <div className="step-content">
                        <h3 className="step-category">STYLE PREFERENCES</h3>
                        <h2>
                            <i className='bx bx-palette header-icon'></i>
                            What's your style?
                        </h2>
                        <p className="step-description">Select all that apply</p>
                        <div className="option-grid multi-select">
                            {STYLE_OPTIONS.map(style => (
                                <button
                                    key={style}
                                    className={`option-btn ${formData.stylePreferences.includes(style) ? 'selected' : ''}`}
                                    onClick={() => setFormData({
                                        ...formData,
                                        stylePreferences: toggleArrayItem(formData.stylePreferences, style)
                                    })}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'colors':
                return (
                    <div className="step-content">
                        <h3 className="step-category">FAVORITE COLORS</h3>
                        <h2>
                            <i className='bx bx-color-fill header-icon'></i>
                            Favorite Colors?
                        </h2>
                        <p className="step-description">Select your preferred colors</p>
                        <div className="color-grid">
                            {COLOR_OPTIONS.map(color => (
                                <button
                                    key={color}
                                    className={`color-btn ${formData.favoriteColors.includes(color) ? 'selected' : ''}`}
                                    onClick={() => setFormData({
                                        ...formData,
                                        favoriteColors: toggleArrayItem(formData.favoriteColors, color)
                                    })}
                                    style={{
                                        backgroundColor: color.toLowerCase(),
                                        color: ['Black', 'Navy', 'Brown'].includes(color) ? 'white' : 'black'
                                    }}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'sizes':
                return (
                    <div className="step-content">
                        <h3 className="step-category">SIZES</h3>
                        <h2>
                            <i className='bx bx-ruler header-icon'></i>
                            Your Sizes
                        </h2>
                        <p className="step-description">Optional - helps with shopping recommendations</p>
                        <div className="size-inputs">
                            <div className="input-group">
                                <label>Top Size</label>
                                <input
                                    type="text"
                                    placeholder="e.g., M, L, XL"
                                    value={formData.sizes.top}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        sizes: { ...formData.sizes, top: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Bottom Size</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 32, 34"
                                    value={formData.sizes.bottom}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        sizes: { ...formData.sizes, bottom: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Shoe Size</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 9, 10.5"
                                    value={formData.sizes.shoes}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        sizes: { ...formData.sizes, shoes: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'location':
                return (
                    <div className="step-content">
                        <h3 className="step-category">LOCATION</h3>
                        <h2>
                            <i className='bx bx-map header-icon'></i>
                            Where are you located?
                        </h2>
                        <p className="step-description">For weather-based outfit recommendations</p>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter your city"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="location-input"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        const step = steps[currentStep];

        if (step.optional) return true;

        switch (step.id) {
            case 'welcome':
                return true;
            case 'style':
                return formData.stylePreferences.length > 0;
            default:
                return true;
        }
    };

    return (
        <div className="setup-wizard-overlay">
            <div className="setup-wizard-container">
                <div className="setup-progress">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                        >
                            <div className="progress-dot"></div>
                            {index < steps.length - 1 && <div className="progress-line"></div>}
                        </div>
                    ))}
                </div>

                <div className="setup-card">
                    {renderStep()}

                    <div className="setup-actions">
                        {currentStep > 0 && (
                            <button
                                className="btn btn-ghost"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                Back
                            </button>
                        )}

                        <div className="action-right">
                            {steps[currentStep].optional && currentStep > 0 && (
                                <button
                                    className="btn btn-ghost"
                                    onClick={handleNext}
                                    disabled={loading}
                                >
                                    Skip
                                </button>
                            )}
                            <button
                                className="btn btn-primary"
                                onClick={handleNext}
                                disabled={!canProceed() || loading}
                            >
                                {loading ? (
                                    <LoadingSpinner size="sm" />
                                ) : currentStep === steps.length - 1 ? (
                                    'Complete'
                                ) : (
                                    'Next'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="setup-step-indicator">
                    Step {currentStep + 1} of {steps.length}
                </p>
            </div>
        </div>
    );
}
