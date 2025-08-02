import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminCustomerManagement.css';

function AdminCustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [orderHistory, setOrderHistory] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login as admin to view customers.');
        return;
      }
      const response = await axios.get('/api/admin/adminCustomers', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchTerm,
          status: statusFilter
        }
      });
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to fetch customers');
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setTempPassword('');
    setShowOrderHistory(false);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/adminCustomers/${customer._id}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderHistory(response.data);
      setShowOrderHistory(true);
    } catch (err) {
      alert('Failed to fetch order history');
    }
  };

  const handleCloseCustomer = () => {
    setSelectedCustomer(null);
    setTempPassword('');
    setShowOrderHistory(false);
    setOrderHistory([]);
  };

  const handleToggleStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const updatedStatus = !selectedCustomer.active;
      await axios.put(`/api/admin/adminCustomers/${selectedCustomer._id}`, { isActive: updatedStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCustomer({ ...selectedCustomer, active: updatedStatus });
      fetchCustomers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleToggleStatusForCustomer = async (customer) => {
    try {
      const token = localStorage.getItem('token');
      const updatedStatus = !customer.active;
      await axios.put(`/api/admin/adminCustomers/${customer._id}`, { isActive: updatedStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers();
      if (selectedCustomer && selectedCustomer._id === customer._id) {
        setSelectedCustomer({ ...selectedCustomer, active: updatedStatus });
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleResetPassword = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/admin/adminCustomers/${selectedCustomer._id}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTempPassword(response.data.tempPassword);
      alert('Temporary password sent to customer email');
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  // ✅ Updated delete function
  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/adminCustomers/${customer._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from UI
      setCustomers(prev => prev.filter(c => c._id !== customer._id));
      if (selectedCustomer && selectedCustomer._id === customer._id) {
        setSelectedCustomer(null);
      }

      alert('Customer deleted successfully');
    } catch (err) {
      alert('Failed to delete customer');
    }
  };

  const handleCreateCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomer = async () => {
    const { firstName, lastName, email, password } = newCustomer;
    if (!firstName || !lastName || !email || !password) {
      alert('Please fill all fields to create a customer');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/adminCustomers', newCustomer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Customer created successfully');
      setNewCustomer({ firstName: '', lastName: '', email: '', password: '' });
      setIsCreating(false);
      fetchCustomers();
    } catch (err) {
      alert('Failed to create customer');
    }
  };

  const handleEditCustomerChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = async () => {
    const { firstName, lastName, email, _id } = selectedCustomer;
    if (!firstName || !lastName || !email) {
      alert('First name, last name and email are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/adminCustomers/${_id}`, { firstName, lastName, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Customer updated successfully');
      fetchCustomers();
    } catch (err) {
      alert('Failed to update customer');
    }
  };

  const handleImpersonateCustomer = async (customer) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/admin/adminCustomers/${customer._id}/impersonate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const impersonationToken = response.data.token;
      localStorage.setItem('impersonationToken', impersonationToken);
      localStorage.setItem('originalAdminToken', token);
      setIsImpersonating(true);
      alert(`You are now impersonating ${customer.firstName} ${customer.lastName}`);
      window.location.href = '/customer-landing';
    } catch (err) {
      alert('Failed to impersonate customer');
    }
  };

  const handleExitImpersonation = () => {
    const originalAdminToken = localStorage.getItem('originalAdminToken');
    if (originalAdminToken) {
      localStorage.setItem('token', originalAdminToken);
      localStorage.removeItem('impersonationToken');
      localStorage.removeItem('originalAdminToken');
      setIsImpersonating(false);
      alert('Exited impersonation mode');
      window.location.href = '/admin-customers';
    }
  };

  return (
    <div className="admin-customer-management">
      <h2>Customer Management</h2>
      {error && <p className="error-message">{error}</p>}

      {!isCreating && (
        <button onClick={() => setIsCreating(true)}>Create New Customer</button>
      )}

      {isCreating && (
        <div className="create-customer-form">
          <h3 class="h3">Create New Customer</h3>
          <input class="fl-name"
            type="text"
            name="firstName"
            placeholder="First Name"
            value={newCustomer.firstName}
            onChange={handleCreateCustomerChange}
          />
          <input class="fl-name"
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={newCustomer.lastName}
            onChange={handleCreateCustomerChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newCustomer.email}
            onChange={handleCreateCustomerChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={newCustomer.password}
            onChange={handleCreateCustomerChange}
          />
          <button onClick={handleCreateCustomer}>Create</button>
          <button onClick={() => setIsCreating(false)}>Cancel</button>
        </div>
      )}

      <div className="search-filter">
        <input class="search-input"
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <select value={statusFilter} onChange={handleStatusFilterChange}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Blocked</option>
        </select>
      </div>

      <table className="customer-table">
        <thead>
          <tr>
            <th class="th">#</th>
            <th class="th">Name</th>
            <th class="th">Email</th>
            <th class="th">Status</th>
            <th class="th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr key={customer._id}>
              <td>{index + 1}</td>
              <td>{customer.firstName} {customer.lastName}</td>
              <td>{customer.email}</td>
              <td>{customer.active ? 'Active' : 'Blocked'}</td>
              <td>
                <button onClick={() => handleViewCustomer(customer)}>View</button>
                <button onClick={() => handleToggleStatusForCustomer(customer)}>
                  {customer.active ? 'Block' : 'Unblock'}
                </button>
                <button onClick={() => handleDeleteCustomer(customer)}>Delete</button>
                <button onClick={() => handleImpersonateCustomer(customer)}>Impersonate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCustomer && (
        <div className="customer-profile-modal">
          <div className="modal-content">
            <h3>Customer Profile - {selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
            <input class="prf"
              type="text"
              name="firstName"
              value={selectedCustomer.firstName}
              onChange={handleEditCustomerChange}
            />
            <input class="prf"
              type="text"
              name="lastName"
              value={selectedCustomer.lastName}
              onChange={handleEditCustomerChange}
            />
            <input class="prf"
              type="email"
              name="email"
              value={selectedCustomer.email}
              onChange={handleEditCustomerChange}
            />
            <p>Status: {selectedCustomer.active ? 'Active' : 'Blocked'}</p>
            {tempPassword && <p>Temporary Password: {tempPassword}</p>}
            <button onClick={handleResetPassword}>Reset Password</button>
            <button onClick={handleToggleStatus}>
              {selectedCustomer.active ? 'Disable Portal' : 'Enable Portal'}
            </button>
            <button onClick={handleSaveCustomer}>Save Profile</button>
            <button onClick={handleCloseCustomer}>Close</button>
          </div>
        </div>
      )}

      {showOrderHistory && (
        <div className="order-history">
          <h3>Order History</h3>
          {orderHistory.length === 0 ? (
            <p>No orders found for this customer.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map(order => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{order.status}</td>
                    <td>{new Date(order.date).toLocaleString()}</td>
                    <td>{order.items.map(item => item.product ? item.product.name : 'Unknown').join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isImpersonating && (
        <div className="impersonation-banner">
          <p>You are impersonating a customer.</p>
          <button onClick={handleExitImpersonation}>Exit Impersonation</button>
        </div>
      )}
    </div>
  );
}

export default AdminCustomerManagement;

