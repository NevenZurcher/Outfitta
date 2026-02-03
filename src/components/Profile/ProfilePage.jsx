import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userProfileService } from '../../services/userProfileService';
import { authService } from '../../services/authService';
import { STYLE_OPTIONS, COLOR_OPTIONS, GENDER_OPTIONS } from '../../constants';
import LoadingSpinner from '../Common/LoadingSpinner';
import './ProfilePage.css';

export default function ProfilePage({ user }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [editing, setEditing] = useState(false);
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
    const navigate = useNavigate();

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        setLoading(true);
        const result = await userProfileService.getUserProfile(user.uid);
        if (result.success) {
            setProfile(result.profile);
            setFormData({
                gender: result.profile.gender || '',
                stylePreferences: result.profile.stylePreferences || [],
                favoriteColors: result.profile.favoriteColors || [],
                sizes: result.profile.sizes || { top: '', bottom: '', shoes: '' },
                location: result.profile.location || ''
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        const result = await userProfileService.updateUserProfile(user.uid, formData);

        if (result.success) {
            setMessage('Profile updated successfully!');
            setEditing(false);
            await loadProfile();
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage('Failed to update profile. Please try again.');
        }

        setSaving(false);
    };

    const handleSignOut = async () => {
        await authService.signOut();
        navigate('/');
    };

    const toggleArrayItem = (array, item) => {
        if (array.includes(item)) {
            return array.filter(i => i !== item);
        }
        return [...array, item];
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <LoadingSpinner message="Loading profile..." />
            </div>
        );
    }

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div>
                    <h1 className="gradient-text">Profile</h1>
                    <p className="profile-email">{user.email}</p>
                </div>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="btn btn-ghost btn-icon">
                        <i className='bx bx-edit'></i>
                    </button>
                )}
            </header>

            {message && (
                <div className={`profile-message ${message.includes('success') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="profile-content">
                {/* Personal Information */}
                <section className="profile-section">
                    <h2>
                        <i className='bx bx-user header-icon'></i>
                        Personal Information
                    </h2>
                    <div className="profile-field">
                        <label>Display Name</label>
                        <p>{profile.displayName || 'Not set'}</p>
                    </div>
                    <div className="profile-field">
                        <label>Gender</label>
                        {editing ? (
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
                        ) : (
                            <p>{profile.gender || 'Not set'}</p>
                        )}
                    </div>
                    <div className="profile-field">
                        <label>Location</label>
                        {editing ? (
                            <input
                                type="text"
                                placeholder="Enter your city"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        ) : (
                            <p>{profile.location || 'Not set'}</p>
                        )}
                    </div>
                </section>

                {/* Style Preferences */}
                <section className="profile-section">
                    <h2>
                        <i className='bx bx-palette header-icon'></i>
                        Style Preferences
                    </h2>
                    {editing ? (
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
                    ) : (
                        <div className="tags-display">
                            {profile.stylePreferences && profile.stylePreferences.length > 0 ? (
                                profile.stylePreferences.map(style => (
                                    <span key={style} className="tag">{style}</span>
                                ))
                            ) : (
                                <p className="empty-text">No style preferences set</p>
                            )}
                        </div>
                    )}
                </section>

                {/* Favorite Colors */}
                <section className="profile-section">
                    <h2>
                        <i className='bx bx-color-fill header-icon'></i>
                        Favorite Colors
                    </h2>
                    {editing ? (
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
                    ) : (
                        <div className="tags-display">
                            {profile.favoriteColors && profile.favoriteColors.length > 0 ? (
                                profile.favoriteColors.map(color => (
                                    <span
                                        key={color}
                                        className="color-tag"
                                        style={{
                                            backgroundColor: color.toLowerCase(),
                                            color: ['Black', 'Navy', 'Brown'].includes(color) ? 'white' : 'black'
                                        }}
                                    >
                                        {color}
                                    </span>
                                ))
                            ) : (
                                <p className="empty-text">No favorite colors set</p>
                            )}
                        </div>
                    )}
                </section>

                {/* Sizes */}
                <section className="profile-section">
                    <h2>
                        <i className='bx bx-ruler header-icon'></i>
                        Sizes
                    </h2>
                    {editing ? (
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
                    ) : (
                        <div className="sizes-display">
                            <div className="size-item">
                                <span className="size-label">Top:</span>
                                <span>{profile.sizes?.top || 'Not set'}</span>
                            </div>
                            <div className="size-item">
                                <span className="size-label">Bottom:</span>
                                <span>{profile.sizes?.bottom || 'Not set'}</span>
                            </div>
                            <div className="size-item">
                                <span className="size-label">Shoes:</span>
                                <span>{profile.sizes?.shoes || 'Not set'}</span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Account Actions */}
                <section className="profile-section">
                    <h2>
                        <i className='bx bx-cog header-icon'></i>
                        Account
                    </h2>
                    <button onClick={handleSignOut} className="btn btn-ghost w-full">
                        <i className='bx bx-log-out'></i> Sign Out
                    </button>
                </section>
            </div>

            {editing && (
                <div className="profile-actions">
                    <button
                        onClick={() => {
                            setEditing(false);
                            loadProfile();
                        }}
                        className="btn btn-ghost"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    );
}
