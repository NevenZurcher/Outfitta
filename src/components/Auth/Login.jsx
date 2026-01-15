import { useState } from 'react';
import { authService } from '../../services/authService';
import LoadingSpinner from '../Common/LoadingSpinner';
import './Login.css';

export default function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (isSignUp) {
                result = await authService.signUp(email, password, displayName);
            } else {
                result = await authService.signIn(email, password);
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);

        try {
            const result = await authService.signInWithGoogle();
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card card-glass">
                <div className="login-header">
                    <h1 className="gradient-text">Wardrobe AI</h1>
                    <p>Your personal AI fashion stylist</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="displayName">Display Name</label>
                            <input
                                id="displayName"
                                type="text"
                                className="input"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your name"
                                required={isSignUp}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {error && <div className="error-text">{error}</div>}

                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? <LoadingSpinner size="sm" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="divider">
                    <span>or</span>
                </div>

                <button onClick={handleGoogleSignIn} className="btn btn-secondary w-full" disabled={loading}>
                    <i className='bx bxl-google' style={{ fontSize: '1.2rem', marginRight: '8px' }}></i>
                    Continue with Google
                </button>

                <div className="toggle-mode">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="btn-ghost"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
