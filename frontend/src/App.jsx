import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import AwsChecklist from './pages/AwsChecklist';
import Modal from 'react-modal';
import Login from './components/Login';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(''); 

  const validateToken = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUsername(result.email.split('@')[0]);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('token');
        openModal()
        setToken('');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('token');
      setToken('');
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    if (storedToken) {
      validateToken(storedToken);
    }
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleLoginSuccess = (email) => {
    const extractedUsername = email.split('@')[0];
    setUsername(extractedUsername);
    setIsLoggedIn(true);
    setToken(localStorage.getItem('token'));
  };

  return (
    <Router>
      <div className="app">
        <Header openModal={openModal} username={username} isLoggedIn={isLoggedIn} />
        <Routes>
          <Route path="/" element={<Home openModal={openModal} isLoggedIn={isLoggedIn} />} />
          <Route
            path="/aws-checklist"
            element={
              <AwsChecklist token={token} />
            }
          />
        </Routes>
        <Footer />

        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Login Modal"
          ariaHideApp={false}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '400px',
              width: '90%',
              height: 'auto',
              maxHeight: '80vh',
              borderRadius: '8px',
              padding: '20px',
              overflow: 'hidden',
            },
          }}
        >
          <Login closeModal={closeModal} handleLoginSuccess={handleLoginSuccess} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        </Modal>
      </div>
    </Router>
  );
}

export default App;
