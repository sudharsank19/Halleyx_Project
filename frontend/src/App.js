import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerLogin from './components/CustomerLogin';
import CustomerRegister from './components/CustomerRegister';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ProductForm from './components/ProductForm';
import CustomerLandingPage from './components/CustomerLandingPage';
import CustomerProfile from './components/CustomerProfile';
import CustomerProductDetail from './components/CustomerProductDetail';
import AdminCustomerManagement from './components/AdminCustomerManagement';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import CustomerOrderManagement from './components/CustomerOrderManagement';
import LandingPage from './components/LandingPage';
import ResetPassword from './components/ResetPassword';
import ForgotPassword from './components/ForgotPassword';
import AdminProducts from './components/AdminProducts';
import AdminOrderManagement from './components/AdminOrderManagement';
import AdminSettings from './components/AdminSettings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/customer-register" element={<CustomerRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-customers" element={<AdminCustomerManagement />} />
        <Route path="/admin-orders" element={<AdminOrderManagement />} />
        <Route path="/product-form" element={<ProductForm />} />
        <Route path="/product-form/:id" element={<ProductForm />} />
        <Route path="/customer-landing" element={<CustomerLandingPage />} />
        <Route path="/customer-profile" element={<CustomerProfile />} />
        <Route path="/product/:id" element={<CustomerProductDetail />} />
        <Route path="/customer-orders" element={<CustomerOrderManagement />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-products" element={<AdminProducts />} />
        <Route path="/admin-settings" element={<AdminSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
