import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/components.css';

const getTypeColor = (type) => {
  const map = { internal: 'var(--color-primary)', supplier: 'var(--color-accent)', customer: 'var(--color-warning)', virtual: 'var(--color-text-muted)' };
  return map[type] || 'var(--color-text-muted)';
};

const SettingsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'internal', warehouse_name: '', short_code: '', address: '' });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations');
      setLocations(res.data.locations);
    } catch (err) {
      // Error logged silently or handled by alert
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/locations', formData);
      setIsModalOpen(false);
      setFormData({ name: '', type: 'internal', warehouse_name: '', short_code: '', address: '' });
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create location');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this location?')) {
      try {
        await api.delete(`/locations/${id}`);
        fetchLocations();
      } catch (err) {
        alert(err.response?.data?.error || 'Cannot delete location');
      }
    }
  };

  return (
    <div className="page-container" style={{animation: 'fadeIn 0.3s ease-out'}}>
      <div className="page-actions">
        <div>
          <h1 style={{fontSize: 'var(--font-size-xl)'}}>Settings</h1>
          <p style={{color: 'var(--color-text-muted)'}}>Manage warehouse locations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Location</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Warehouse</th><th style={{textAlign:'right'}}>Actions</th></tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <tr key={loc.id}>
                  <td style={{fontWeight:500}}>{loc.name}</td>
                  <td>
                    <span style={{padding:'2px 8px', borderRadius:'12px', fontSize:'var(--font-size-xs)', border: `1px solid ${getTypeColor(loc.type)}`, color: getTypeColor(loc.type)}}>
                      {loc.type.toUpperCase()}
                    </span>
                  </td>
                  <td>{loc.warehouse_name || '-'}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn btn-danger" onClick={() => handleDelete(loc.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Location</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{display:'flex', flexDirection:'column', gap:'var(--space-4)'}}>
                <div className="form-group">
                  <label className="form-label">Location Name</label>
                  <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. North Aisle" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="internal">Internal</option>
                    <option value="supplier">Supplier</option>
                    <option value="customer">Customer</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
                <div style={{display:'flex', gap:'var(--space-4)'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Short Code</label>
                    <input className="form-input" value={formData.short_code} onChange={e => setFormData({...formData, short_code: e.target.value})} placeholder="WH/01" />
                  </div>
                  <div className="form-group" style={{flex:2}}>
                    <label className="form-label">Warehouse Name (optional)</label>
                    <input className="form-input" value={formData.warehouse_name} onChange={e => setFormData({...formData, warehouse_name: e.target.value})} placeholder="Primary WH" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-input" rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Storage St, City"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
