import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('/api/auth/admin/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setMessage('Login successful!');
      navigate('/admin-dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="admin-login-container">
      <form onSubmit={handleSubmit} className="admin-login-form">
        <h1 className="admin-login-title">Admin Login</h1>
    
        <div className="admin-login-field">
                    <label>Login:</label><br />

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="admin-login-input"
          />
        </div>

        <div className="admin-login-field">
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="admin-login-input"
          />
        </div>

        <button type="submit" className="admin-login-button">
          Login
        </button>
      </form>

      {message && <p className="admin-login-message">{message}</p>}
    </div>
  );
}

export default AdminLogin;
