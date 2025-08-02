import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminSettings.css';

function AdminSettings() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('#FF5733');
  const [secondaryColor, setSecondaryColor] = useState('#00AACC');
  const [fontFamily, setFontFamily] = useState('Roboto');
  const [customHtml, setCustomHtml] = useState('');

  const fontOptions = [
    'Roboto',
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Verdana, sans-serif',
    'Tahoma, sans-serif',
    'Trebuchet MS, sans-serif',
    'Impact, sans-serif',
  ];

  useEffect(() => {
    // Fetch customers list on component mount with auth token
    const token = localStorage.getItem('token');
    axios.get('/api/admin/adminCustomers', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        setCustomers(response.data);
      })
      .catch(error => {
        console.error('Error fetching customers:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      // Fetch branding settings for selected customer
      axios.get(`/api/admin/adminCustomers/${selectedCustomerId}/branding`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(response => {
          const data = response.data;
          setLogoPreview(data.logoUrl || null);
          setPrimaryColor(data.primaryColor || '#FF5733');
          setSecondaryColor(data.secondaryColor || '#00AACC');
          setFontFamily(data.fontFamily || 'Roboto');
          setCustomHtml(data.customHtml || '');
          setLogo(null); // reset logo file input
        })
        .catch(error => {
          console.error('Error fetching branding settings:', error);
        });
    }
  }, [selectedCustomerId]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSaveSettings = () => {
    if (!selectedCustomerId) {
      alert('Please select a customer first.');
      return;
    }

    const formData = new FormData();
    if (logo) {
      formData.append('logo', logo);
    }
    formData.append('primaryColor', primaryColor);
    formData.append('secondaryColor', secondaryColor);
    formData.append('fontFamily', fontFamily);
    formData.append('customHtml', customHtml);

    const token = localStorage.getItem('token');
    axios.post(`/api/admin/adminCustomers/${selectedCustomerId}/branding`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(() => {
        alert('Branding settings saved successfully.');
      })
      .catch(error => {
        console.error('Error saving branding settings:', error);
        alert('Failed to save branding settings.');
      });
  };

  return (
    <div className="admin-settings">
      <h2>Customer Portal Branding Settings</h2>

      <div className="form-group">
        <label>Select Customer:</label>
        <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
          <option value="">-- Select a customer --</option>
          {customers.map(customer => (
            <option key={customer._id} value={customer._id}>
              {customer.name || customer.email}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Logo Upload:</label>
        <input type="file" accept="image/*" onChange={handleLogoChange} />
        {logoPreview && <img src={logoPreview} alt="Logo Preview" className="logo-preview" />}
      </div>

      <div className="form-group color-picker-group">
        <label>Primary Color:</label>
        <input
          type="color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          className="color-picker-input"
        />
        <input
          type="text"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          maxLength={7}
          placeholder="#FF5733"
          className="color-hex-input"
        />
        <div className="color-circle" style={{ backgroundColor: primaryColor }}></div>
      </div>

      <div className="form-group color-picker-group">
        <label>Secondary Color:</label>
        <input
          type="color"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
          className="color-picker-input"
        />
        <input
          type="text"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
          maxLength={7}
          placeholder="#00AACC"
          className="color-hex-input"
        />
        <div className="color-circle" style={{ backgroundColor: secondaryColor }}></div>
      </div>

      <div className="form-group">
        <label>Font Family:</label>
        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <h2>Dashboard</h2>
      <div className="form-group">
        <label>Custom HTML Block for dashboard:</label>
        <textarea
          value={customHtml}
          onChange={(e) => setCustomHtml(e.target.value)}
          rows={6}
          placeholder="Enter custom HTML or text here"
        />
      </div>

      <button className="save-settings-button" onClick={handleSaveSettings}>Save Settings</button>
    </div>
  );
}

export default AdminSettings;
