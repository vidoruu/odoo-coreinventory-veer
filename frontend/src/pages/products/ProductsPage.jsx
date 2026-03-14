import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import api from '../../services/api';
import '../../styles/components.css';

const ProductsPage = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', category_id: '', uom: 'Units', min_stock: 0, description: '', initial_stock: 0, source_location_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
        api.get('/locations')
      ]);
      setProducts(prodRes.data.products);
      setCategories(catRes.data.categories);
      setLocations(locRes.data.locations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name, sku: product.sku, category_id: product.category_id || '',
        uom: product.uom, min_stock: product.min_stock, description: product.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', sku: '', category_id: '', uom: 'Units', min_stock: 0, description: '', initial_stock: 0, source_location_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
      } else {
        await api.post('/products', formData);
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete');
      }
    }
  };

  return (
    <div className="page-container" style={{animation: 'fadeIn 0.3s ease-out'}}>
      <div className="page-actions">
        <div>
          <h1 style={{fontSize: 'var(--font-size-xl)'}}>Stock</h1>
          <p style={{color: 'var(--color-text-muted)'}}>Manage your inventory levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ New Product</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th><th>On Hand</th><th>Free to Use</th><th>UoM</th><th>SKU</th><th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:500}}>{p.name}</td>
                  <td>
                    <span style={{fontWeight:600, color: p.on_hand <= p.min_stock ? 'var(--color-danger)' : 'var(--color-text)'}}>
                      {p.on_hand}
                    </span>
                  </td>
                  <td style={{color:'var(--color-text-subtle)'}}>{p.on_hand}</td>
                  <td style={{color:'var(--color-text-subtle)'}}>{p.uom}</td>
                  <td style={{fontFamily:'monospace', color:'var(--color-primary)'}}>{p.sku}</td>
                  <td style={{textAlign:'right', display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                    <button className="btn btn-secondary" onClick={() => handleOpenModal(p)}>Edit</button>
                    {user?.role === 'admin' && (
                      <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Del</button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="6" style={{textAlign:'center', padding:'var(--space-6)', color:'var(--color-text-muted)'}}>No products found. Create one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Product' : 'New Product'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{display:'flex', flexDirection:'column', gap:'var(--space-4)'}}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Storage Shelf" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input required className="form-input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU-1001" />
                </div>
                <div style={{display:'flex', gap:'var(--space-4)'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Category</label>
                    <select className="form-input" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                      <option value="">-- Select --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Unit of Measure</label>
                    <input className="form-input" value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} placeholder="Units/Sets/etc." />
                  </div>
                </div>
                <div style={{display:'flex', gap:'var(--space-4)'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Minimum Stock Alert</label>
                    <input type="number" className="form-input" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})} />
                  </div>
                  {!editingId && (
                    <div className="form-group" style={{flex:1}}>
                      <label className="form-label">Initial Stock</label>
                      <input type="number" className="form-input" value={formData.initial_stock} onChange={e => setFormData({...formData, initial_stock: parseFloat(e.target.value) || 0})} />
                    </div>
                  )}
                </div>
                {!editingId && (
                  <div className="form-group">
                    <label className="form-label">Source Location (Where is stock coming from?)</label>
                    <select className="form-input" value={formData.source_location_id} onChange={e => setFormData({...formData, source_location_id: e.target.value})}>
                      <option value="">-- Default (Inventory Loss) --</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
                    </select>
                    <p style={{fontSize:'var(--font-size-xs)', color:'var(--color-text-muted)', marginTop:'var(--space-1)'}}>
                      This location will be used if you provide an <strong>Initial Stock</strong> amount above.
                    </p>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
