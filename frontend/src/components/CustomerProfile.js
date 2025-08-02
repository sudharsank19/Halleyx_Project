import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerProfile.css';

function CustomerProfile() {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const impersonationToken = localStorage.getItem('impersonationToken');
        const token = impersonationToken || localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('/api/auth/customer/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
      } catch (err) {
        setProfileError('Failed to load profile');
      }
    }
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    setProfileError('');
    setProfileMessage('');
    try {
      const impersonationToken = localStorage.getItem('impersonationToken');
      const token = impersonationToken || localStorage.getItem('token');
      await axios.put('/api/auth/customer/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileMessage('Profile updated successfully');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    try {
      const impersonationToken = localStorage.getItem('impersonationToken');
      const token = impersonationToken || localStorage.getItem('token');
      await axios.post('/api/auth/customer/change-password', passwords, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordMessage('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="customer-profile">
      <h2>My Profile</h2>
      {profileError && <p className="error-message">{profileError}</p>}
      {profileMessage && <p className="success-message">{profileMessage}</p>}
      <div className="profile-field">
        <label>First Name:</label>
        <input name="firstName" value={profile.firstName} onChange={handleProfileChange} />
      </div>
      <div className="profile-field">
        <label>Last Name:</label>
        <input name="lastName" value={profile.lastName} onChange={handleProfileChange} />
      </div>
      <div className="profile-field">
        <label>Email:</label>
        <input name="email" value={profile.email} onChange={handleProfileChange} disabled />
      </div>
      <button onClick={handleProfileSave}>Save Changes</button>

      <h2>Change Password</h2>
      {passwordError && <p className="error-message">{passwordError}</p>}
      {passwordMessage && <p className="success-message">{passwordMessage}</p>}
      <div className="password-field">
        <label>Current:</label>
        <input
          type="password"
          name="currentPassword"
          value={passwords.currentPassword}
          onChange={handlePasswordChange}
        />
      </div>
      <div className="password-field">
        <label>New:</label>
        <input
          type="password"
          name="newPassword"
          value={passwords.newPassword}
          onChange={handlePasswordChange}
        />
      </div>
      <div className="password-field">
        <label>Confirm:</label>
        <input
          type="password"
          name="confirmPassword"
          value={passwords.confirmPassword}
          onChange={handlePasswordChange}
        />
      </div>
      <button onClick={handleChangePassword}>Change Password</button>
    </div>
  );
}

export default CustomerProfile;