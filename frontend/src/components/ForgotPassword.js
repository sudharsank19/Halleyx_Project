import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      setMessage('If this email is registered, a reset link has been sent.');
      // Store the reset token from the response
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
      setStep(2);
    } catch {
      setMessage('Failed to send OTP');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/auth/verify-otp', { email, otp });
      setMessage('OTP verified. Please enter your new password.');
      setStep(3);
    } catch {
      setMessage('Invalid or expired OTP');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }
    try {
      // Include token and otp in the reset request
      await axios.post('/api/auth/reset-password', { email, token: resetToken, otp, newPassword });
      setMessage('Password reset successful. You can now login.');
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
    } catch {
      setMessage('Failed to reset password');
    }
  };

  return (
    <div className="forgot-container">
      <form className="forgot-form" onSubmit={
        step === 1 ? handleEmailSubmit :
        step === 2 ? handleOtpSubmit :
        handleResetSubmit
      }>
        {step === 1 && (
          <>
            <h2>Forgot Password</h2>
            <div className="input-group">
              <label>Email:</label>
              <input class="cl-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="button-center" type="submit">Send OTP</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Enter OTP</h2>
            <div className="input-group">
              <label>OTP:</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <button className="button-center" type="submit">Verify OTP</button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Reset Password</h2>
            <div className="input-group">
              <label>New Password:</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Confirm Password:</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button className="button-center" type="submit">Reset Password</button>
          </>
        )}
        {message && <p className="forgot-message">{message}</p>}
      </form>
    </div>
  );
}

export default ForgotPassword;
