import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-container">
      <h1 className="landing-title">Welcome to SuperMart</h1>
      <div className="card-container">
        <Link to="/customer-login" className="card-link">
          <div className="card-icon">👤</div>
          <h3>Customer Login</h3>
          <p>Access your customer account</p>
        </Link>
        <Link to="/customer-register" className="card-link">
          <div className="card-icon">📝</div>
          <h3>Customer Register</h3>
          <p>Create a new customer account</p>
        </Link>
        <Link to="/admin-login" className="card-link">
          <div className="card-icon">🛡️</div>
          <h3>Admin Login</h3>
          <p>Access the admin portal</p>
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;
