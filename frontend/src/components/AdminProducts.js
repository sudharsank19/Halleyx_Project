import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminProducts.css';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  // Fetch products from backend API with JWT token authorization
  useEffect(() => {
    async function fetchProducts() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please login.');
          setLoading(false);
          return;
        }
        const response = await axios.get('/api/admin/products', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            filter: searchTerm,
            sortBy: 'name',
            sortOrder: sortOrder
          }
        });
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setProducts(data);
        setLoading(false);
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError('Access denied: insufficient permissions.');
        } else if (err.response && err.response.status === 401) {
          setError('Unauthorized: please login.');
        } else {
          setError('Failed to fetch products');
        }
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchTerm, sortOrder]);

  const handleEdit = (product) => {
    navigate(`/product-form/${product._id}`);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  if (loading) return <p>Loading products...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="admin-products-container">
      <header className="admin-products-header">
        <h1 class="h1">Product Management</h1>
        <button
          className="add-product-button"
          onClick={() => navigate('/product-form')}
        >
          Add Product
        </button>
      </header>

      <div className="search-sort-container">
        <input class="search-input"
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          className="sort-select"
        >
          <option value="asc">Sort by Name: A-Z</option>
          <option value="desc">Sort by Name: Z-A</option>
        </select>
      </div>

      <table className="products-table">
        <thead>
          <tr>
            <th class="th1">ID</th>
            <th class="th1">Image</th>
            <th class="th1">Name</th>
            <th class="th1">Price</th>
            <th class="th1">Stock Quantity</th>
            <th class="th1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product._id}>
              <td>{product._id}</td>
              <td>
                {product.image ? (
                  <img src={product.image} alt={product.name} className="product-image" />
                ) : (
                  <span>No Image</span>
                )}
              </td>
              <td>{product.name}</td>
              <td>{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</td>
              <td>{product.stock_quantity}</td>
              <td>
                <button
                  className="action-button edit-button"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="action-button delete-button"
                  onClick={() => handleDelete(product._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminProducts;
