import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [orders, setOrders] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin-login');
          return;
        }
        const res = await fetch('/api/admin/dashboard-data', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401 || res.status === 403) {
          navigate('/admin-login');
          return;
        }
        const data = await res.json();
        setTotalProducts(data.totalProducts || 0);
        setTotalCustomers(data.totalCustomers || 0);
        setOrders(data.orders || { pending: 0, processing: 0, shipped: 0 });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin-login');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <section className="admin-summary">
        <div className="summary-card">
          <h3>Total Products</h3>
          <p>{totalProducts}</p>
        </div>
        <div className="summary-card">
          <h3>Total Customers</h3>
          <p>{totalCustomers}</p>
        </div>
        <div className="summary-card">
          <h3>Orders</h3>
          <p>Pending: {orders.pending}</p>
          <p>Processing: {orders.processing}</p>
          <p>Shipped: {orders.shipped}</p>
        </div>
      </section>

      <nav className="admin-nav">
        <button className="nav-btn" onClick={() => navigate('/admin-products')}>Products</button>
        <button className="nav-btn" onClick={() => navigate('/admin-customers')}>Customers</button>
        <button className="nav-btn" onClick={() => navigate('/admin-orders')}>Orders</button>
        <button className="nav-btn" onClick={() => navigate('/admin-settings')}>Settings</button>
      </nav>
    </div>
  );
}

export default AdminDashboard;
