import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CustomerRegister.css'; // 👈 import the CSS file

function CustomerRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const validatePassword = (pwd) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setValidationError('');

    if (!validatePassword(password)) {
      setValidationError('Password must be at least 8 characters long and include uppercase, lowercase, and a number.');
      return;
    }

    try {
      const response = await axios.post('/api/auth/customer/register', {
        email, password, firstName, lastName
      });
      localStorage.setItem('token', response.data.token);
      setMessage('Registration successful!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="customer-register-container">
      <form onSubmit={handleSubmit} className="customer-register-form">
        <h1>Customer Registration</h1>
        
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {validationError && <p className="validation-error">{validationError}</p>}
                 
      <div className="form-group">
  <label>First Name:</label>
  <input
  type="input-text"
  className="input-text"
  value={firstName}
  onChange={e => setFirstName(e.target.value)}
  required
/>

</div>


<div className="form-group">
  <label>Last Name:</label>
  <input
    className="input-text"
    type="input-text"
    value={lastName}
    onChange={e => setLastName(e.target.value)}
    required
  />
</div>


        <button type="submit" className="customer-register-button">
          Register
        </button>

        <p className="login-link">
          Already have an account? <Link to="/customer-login">Login</Link>
        </p>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default CustomerRegister;
