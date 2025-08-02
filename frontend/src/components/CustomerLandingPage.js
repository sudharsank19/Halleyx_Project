import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './CustomerLandingPage.css';

function CustomerLandingPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [branding, setBranding] = useState({
    logoUrl: null,
    primaryColor: '#a0ff33ff',
    secondaryColor: '#00AACC',
    fontFamily: 'Roboto',
    customHtml: ''
  });
  const [showPopup, setShowPopup] = useState(false);
  const cartItemCount = 3; // Sample cart count

  useEffect(() => {
    // Check for impersonation token
    const impersonationToken = localStorage.getItem('impersonationToken');
    if (impersonationToken) {
      setIsImpersonating(true);
      // Set axios default header to impersonation token
      axios.defaults.headers.common['Authorization'] = `Bearer ${impersonationToken}`;
    } else {
      // Use normal token if present
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }

    async function fetchProducts() {
      try {
        const response = await axios.get('/api/products', {
          params: {
            page: 1,
            pageSize: 20,
            sortBy: 'name',
            sortOrder: 'asc',
            filter: ''
          }
        });
        const data = response.data.items || [];
        setProducts(data);
      } catch (err) {
        setError('Failed to load products');
      }
    }

    async function fetchBranding() {
      try {
        const response = await axios.get('/api/auth/customer/branding');
        setBranding(response.data);
        setError(null);
        setShowPopup(true); // Show popup after branding is fetched
      } catch (err) {
        console.error('Failed to load branding settings', err);
        setError('Failed to load branding settings');
      }
    }

    fetchProducts();
    fetchBranding();

    // Setup socket.io client for real-time branding updates
    const socket = io();

    // Join room with user id if available
    const userId = localStorage.getItem('userId');
    if (userId) {
      socket.emit('joinRoom', userId);
    }

    socket.on('brandingUpdated', (data) => {
      setBranding(data.branding);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    let timer;
    if (showPopup) {
      timer = setTimeout(() => {
        setShowPopup(false);
      }, 2000); // Hide popup after 5 seconds
    }
    return () => clearTimeout(timer);
  }, [showPopup]);

  const handleExitImpersonation = () => {
    const originalAdminToken = localStorage.getItem('originalAdminToken');
    const originalCustomerToken = localStorage.getItem('originalCustomerToken');

    if (originalAdminToken) {
      localStorage.setItem('token', originalAdminToken);
      localStorage.removeItem('impersonationToken');
      localStorage.removeItem('originalAdminToken');
      setIsImpersonating(false);
      axios.defaults.headers.common['Authorization'] = `Bearer ${originalAdminToken}`;
      alert('Exited impersonation mode. Returning to admin portal.');
      window.location.href = '/admin-customers';
    } else if (originalCustomerToken) {
      localStorage.setItem('token', originalCustomerToken);
      localStorage.removeItem('impersonationToken');
      localStorage.removeItem('originalCustomerToken');
      setIsImpersonating(false);
      axios.defaults.headers.common['Authorization'] = `Bearer ${originalCustomerToken}`;
      alert('Exited impersonation mode.');
      window.location.href = '/customer-landing';
    }
  };

  return (
    <div
      className="customer-landing-page"
      style={{ fontFamily: branding.fontFamily }}
    >
      {isImpersonating && (
        <div className="impersonation-banner" style={{ backgroundColor: '#ffcc00', padding: '10px', textAlign: 'center' }}>
          <p>You are impersonating a customer.</p>
          <button onClick={handleExitImpersonation}>Exit Impersonation</button>
        </div>
      )}

      {showPopup && (
        <div className="custom-popup-overlay">
          <div className="custom-popup">
            <button className="custom-popup-close" onClick={() => setShowPopup(false)}>×</button>
            <div
              className="custom-popup-content"
              dangerouslySetInnerHTML={{ __html: branding.customHtml }}
            />
          </div>
        </div>
      )}

      <header
        className="clp-header"
        style={{ backgroundColor: branding.primaryColor }}
      >
        <div class="logo1">
          <Link to="/" className="clp-logo">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ height: '50px' }} />
            ) : (
              ''
            )}
          </Link>
          <h1 class="app-name">MegaMart</h1>
        </div>
        
        <nav>
          <ul className="clp-nav">
            {['Shop', 'Categories', 'Deals', 'Contact'].map(item => (
              <li key={item}>
                <Link to={`/${item.toLowerCase()}`} className="clp-nav-link" style={{ color: branding.secondaryColor }}>
                  {item}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/customer-profile" className="clp-nav-link" style={{ color: branding.secondaryColor }}>
                My Profile
              </Link>
            </li>
            <li>
              <Link to="/order-history" className="clp-nav-link" style={{ color: branding.secondaryColor }}>
                Order History
              </Link>
            </li>
          </ul>
        </nav>
        <div className="clp-actions-animated">
          <Link to="/customer-profile" title="User Profile" className="clp-icon-animated" style={{ color: branding.secondaryColor }}>
            👤
          </Link>
          <Link to="/admin-login" title="Admin Login" className="clp-icon-animated" style={{ color: branding.secondaryColor }}>
            🛡️
          </Link>
          <Link to="/cart" title="Cart" className="clp-icon-animated cart-with-count" style={{ color: branding.secondaryColor }}>
            🛒
            <span className="cart-count-animated">{cartItemCount}</span>
          </Link>
          <Link to="/" title="Home" className="clp-icon-animated" style={{ color: branding.secondaryColor }}>
            🏠
          </Link>
        </div>
      </header>

      <section className="clp-hero" style={{ backgroundColor: branding.primaryColor, color: '#fff' }}>
        <h1>Shop the Latest in Fashion, Electronics & Accessories</h1>
        <p>Trendy outfits, smart devices, and stylish accessories – all in one place!</p>
      </section>

      <section className="clp-products">
        <h2>Featured Products</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="clp-product-grid">
          {products.length === 0 && !error && <p>Loading products...</p>}
          {products.map(product => (
            <Link key={product?._id || Math.random()} to={`/product/${product?._id || ''}`} className="clp-product-card">
              <img src={product?.image || 'https://via.placeholder.com/150'} alt={product?.name || 'Unknown Product'} />
              <h3>{product?.name || 'Unknown Product'}</h3>
              <p>₹{(product?.price || 0).toFixed(2)}</p>
            </Link>
          ))}
        </div>
        {error && error === 'Failed to load branding settings' && (
          <p style={{ color: 'red', marginTop: '10px' }}>Failed to load branding settings. Some branding elements may not display correctly.</p>
        )}
      </section>

      <section className="clp-categories">
        <h2>Shop by Category</h2>
        <div className="clp-category-grid">
          <div className="clp-category-item gradient-box">Men's Clothing</div>
          <div className="clp-category-item gradient-box">Women's Clothing</div>
          <div className="clp-category-item gradient-box">Mobiles & Tablets</div>
          <div className="clp-category-item gradient-box">Laptops & Accessories</div>
          <div className="clp-category-item gradient-box">Watches & Jewelry</div>
          <div className="clp-category-item gradient-box">Home Appliances</div>
        </div>
      </section>

      <section className="clp-discounts">
        <h2>Today's Deals & Discounts</h2>
        <ol className="clp-discount-list">
          <li className="clp-discount-item">💃 <strong>Buy 1 Get 1</strong> on Women’s Dresses</li>
          <li className="clp-discount-item">💻 <strong>20% off</strong> on Select Laptops</li>
          <li className="clp-discount-item">⌚ <strong>Flat ₹500 off</strong> on Smartwatches</li>
        </ol>
      </section>

      <section className="clp-custom-html" dangerouslySetInnerHTML={{ __html: branding.customHtml }} />

      <section className="clp-footer">
        <p>&copy; 2025 MegaMart. All rights reserved.</p>
      </section>
    </div>
  );
}

export default CustomerLandingPage;
