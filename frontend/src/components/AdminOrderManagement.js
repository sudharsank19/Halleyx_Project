import React, { useState, useEffect } from 'react';
import './AdminOrderManagement.css';

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      if (!token) {
        window.location.href = '/admin-login';
        return;
      }
      let url = '/api/orders/admin/orders';

      // Build query params for filters
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterDateFrom) params.append('dateFrom', filterDateFrom);
      if (filterDateTo) params.append('dateTo', filterDateTo);
      if (filterCustomer) params.append('customer', filterCustomer);

      if ([...params].length > 0) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        window.location.href = '/admin-login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();

      // Calculate total for each order
      const ordersWithTotal = data.map(order => {
        const total = order.items.reduce((sum, item) => {
          return sum + (item.product.price * item.quantity);
        }, 0);
        return { ...order, total };
      });

      setOrders(ordersWithTotal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const handleApplyFilters = () => {
    fetchOrders();
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseOrder = () => {
    setSelectedOrder(null);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setError('');
    try {
      const token = localStorage.getItem('token');
      const statusSelect = document.querySelector('.status-select');
      const newStatus = statusSelect ? statusSelect.value : selectedOrder.status;

      // Prepare updated order data
      const updatedOrder = {
        status: newStatus,
        shippingAddress: selectedOrder.shippingAddress,
        items: selectedOrder.items
      };

      const response = await fetch(`/api/orders/admin/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedOrder)
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setError('');
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/orders/admin/orders/${selectedOrder._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-order-management">
      <h2>Orders</h2>

      <div className="filters">
        <label class="tm">
          Status:
          <select value={filterStatus} onChange={handleFilterChange(setFilterStatus)} className="filter-select">
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="In progress">In progress</option>
            <option value="Complete">Complete</option>
          </select>
        </label>
        <label class="tm">
          Date From:
          <input type="date" value={filterDateFrom} onChange={handleFilterChange(setFilterDateFrom)} className="filter-input" />
        </label>
        <label class="tm">
          Date To:
          <input type="date" value={filterDateTo} onChange={handleFilterChange(setFilterDateTo)} className="filter-input" />
        </label>
        <label class="tm">
          Customer:
          <input class="search-sort" type="text" value={filterCustomer} onChange={handleFilterChange(setFilterCustomer)} placeholder="Customer name or email" className="filter-input" />
        </label>
        <button onClick={handleApplyFilters} className="filter-button">Apply Filters</button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th class="th">#</th>
              <th class="th">Order ID</th>
              <th class="th">Customer</th>
              <th class="th">Status</th>
              <th class="th">Total</th>
              <th class="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-orders">No orders found.</td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr key={order._id}>
                  <td>{index + 1}</td>
                  <td>{order._id}</td>
                  <td>{order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.email : 'N/A'}</td>
                  <td>{order.status}</td>
                  <td>${order.total ? order.total.toFixed(2) : '0.00'}</td>
                  <td>
                  <button onClick={() => handleViewOrder(order)} className="action-button view">View</button>
                  <button onClick={() => { setSelectedOrder(order); handleUpdateOrder(); }} className="action-button update">Update</button>
                  <button onClick={() => { setSelectedOrder(order); handleDeleteOrder(); }} className="action-button delete">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Order Details - #{selectedOrder._id}</h3>
            <p><strong>Status:</strong> 
              <select defaultValue={selectedOrder.status} className="status-select">
                <option value="Pending">Pending</option>
                <option value="In progress">In progress</option>
                <option value="Complete">Complete</option>
              </select>
            </p>
            <h4>Products</h4>
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Image</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map(item => (
                  <tr key={item.product._id}>
                    <td>{item.product.name}</td>
                    <td>
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="product-image" />
                      ) : (
                        'No image'
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        className="quantity-input"
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value, 10);
                          if (isNaN(newQuantity) || newQuantity < 1) return;
                          const updatedItems = selectedOrder.items.map(i =>
                            i.product._id === item.product._id ? { ...i, quantity: newQuantity } : i
                          );
                          setSelectedOrder({ ...selectedOrder, items: updatedItems });
                          // Update total in orders list as well
                          const updatedOrders = orders.map(order => {
                            if (order._id === selectedOrder._id) {
                              const total = updatedItems.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
                              return { ...order, items: updatedItems, total };
                            }
                            return order;
                          });
                          setOrders(updatedOrders);
                        }}
                      />
                    </td>
                    <td>${item.product.price.toFixed(2)}</td>
                    <td>${(item.product.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4>Billing & Shipping Info</h4>
            <p>Billing Address: {/* TODO: billing address here */}</p>
            <p>Shipping Address: {selectedOrder.shippingAddress ? (
              <>
                {selectedOrder.shippingAddress.addressLine1}<br />
                {selectedOrder.shippingAddress.addressLine2 && (<>{selectedOrder.shippingAddress.addressLine2}<br /></>)}
                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}<br />
                {selectedOrder.shippingAddress.country}<br />
                Phone: {selectedOrder.shippingAddress.phone}
              </>
            ) : 'N/A'}</p>
            <div className="modal-actions">
              <button onClick={handleUpdateOrder} className="modal-button save">Save</button>
              <button onClick={handleDeleteOrder} className="modal-button delete">Delete</button>
              <button className="modal-button close" onClick={handleCloseOrder}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrderManagement;
