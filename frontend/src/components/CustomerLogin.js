import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './CustomerLogin.css'; // 👈 Importing CSS file

function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('/api/auth/customer/login', {
        email: email.trim(),
        password
      });
      localStorage.setItem('token', response.data.token);
      setMessage('Login successful!');
      navigate('/customer-landing');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="cl-container">
      <form className="cl-form" onSubmit={handleSubmit}>
        <h1 className="cl-title">Customer Login</h1>
        <div className="cl-input-group">
          <label class="label">Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="cl-input"
          />
        </div>
        <div className="cl-input-group">
          <label class="label">Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="cl-input"
          />
        </div>
        <button type="submit" className="cl-button">
          Login
        </button>
        <div className="cl-links">
          <p>
            New user? <Link to="/customer-register" className="cl-link">Register</Link>
          </p>
          <Link to="/forgot-password" className="cl-link">Forgot Password?</Link>
        </div>
        {message && <p className="cl-message">{message}</p>}
      </form>
    </div>
  );
}

export default CustomerLogin;
