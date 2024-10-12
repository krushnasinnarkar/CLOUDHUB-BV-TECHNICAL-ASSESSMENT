import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate for programmatic navigation
import './Header.css';
import logo from '../assets/logo.png';

const Header = ({ openModal, username, isLoggedIn }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate(); // Hook for navigation

    const handleAwsChecklistClick = () => {
        if (isLoggedIn) {
            navigate('/aws-checklist'); // Navigate to /aws-checklist if logged in
        } else {
            openModal(); // Open login modal if not logged in
        }
    };

    return (
        <header className="header">
            <div className="logo">
                <Link to="/">
                    <img src={logo} alt="Cloudhub Security Hub Logo" />
                </Link>
            </div>

            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    {/* AWS Security Checklist link with conditional logic */}
                    <li>
                        <span onClick={handleAwsChecklistClick} style={{ cursor: 'pointer' }}>
                            AWS Security Checklist
                        </span>
                    </li>
                    <li>{username ? (
                        <span>{username}</span>
                    ) : (<span onClick={openModal} style={{ cursor: 'pointer' }}>Login/Signup</span>)}</li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;
