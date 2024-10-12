import React, { useState } from 'react';
import './Login.css';

const Login = ({ closeModal, handleLoginSuccess, isLoggedIn, setIsLoggedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const toggleForm = () => {
        setIsLoggedIn(!isLoggedIn);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url = isLoggedIn ? 'http://127.0.0.1:5000/api/login' : 'http://127.0.0.1:5000/api/signup';
        const data = isLoggedIn
            ? { email, password }
            : { email, password, confirm_password: confirmPassword };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('token', result.token);
                setIsLoggedIn(true);
                handleLoginSuccess(email);
                closeModal();
            } else {
                setError(result.error || 'An error occurred');
            }
        } catch (err) {
            console.error('Network error:', err);
            setError('Network error. Please try again.'); 
        }
    };


    return (
        <div className="modal">
            <div className="modal-content">
                <button className="close-button" onClick={closeModal}>×</button>
                <h2>{isLoggedIn ? 'Login' : 'Register'}</h2>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {!isLoggedIn && (
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    )}
                    <button type="submit">{isLoggedIn ? 'Login' : 'Register'}</button>
                </form>

                <p className="toggle-text">
                    {isLoggedIn ? (
                        <>
                            Don't have an account? <span onClick={toggleForm} className="toggle-link">Register here</span>
                        </>
                    ) : (
                        <>
                            Already have an account? <span onClick={toggleForm} className="toggle-link">Login here</span>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default Login;
