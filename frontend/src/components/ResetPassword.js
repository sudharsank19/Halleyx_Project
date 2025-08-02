import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Debugging: Log the values being sent
    console.log('Reset password request data:', { email, token, newPassword });
    
    // Check if all required fields are present
    if (!email || !token || !newPassword) {
      setMessage('Missing required fields. Please check the reset link and try again.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }
    try {
      await axios.post('/api/auth/reset-password', {
        email,
        token,
        newPassword,
      });
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/customer-login');
      }, 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="reset-container">
      <form className="reset-form" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>
        <div className="form-group">
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
        {message && <p className="reset-message">{message}</p>}
      </form>
    </div>
  );
}

export default ResetPassword;
