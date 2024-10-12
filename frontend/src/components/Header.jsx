import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/logo.png';

const Header = ({ openModal, username, isLoggedIn }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate(); 

    const handleAwsChecklistClick = () => {
        if (isLoggedIn) {
            navigate('/aws-checklist');
        } else {
            openModal();
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
                    {/* AWS Security Checklist */}
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
