import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = ({ openModal, isLoggedIn }) => {
    const navigate = useNavigate();

    const handleGoToChecklist = () => {
        if (isLoggedIn) {
            navigate('/aws-checklist'); // Navigate to checklist if logged in
        } else {
            openModal(); // Open login modal if not logged in
        }
    };

    return (
        <main className="home-content">
            <h1>Welcome to Cloudhub Security Hub</h1>
            <p>Access the comprehensive AWS Security Checklist to ensure your cloud security controls are up to standard.</p>
            <button onClick={handleGoToChecklist}>Go to AWS Security Checklist</button>
        </main>
    );
};

export default Home;
