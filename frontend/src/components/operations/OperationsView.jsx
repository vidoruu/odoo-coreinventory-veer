import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/components.css';

const STATUS_MAP = {
  draft: 'status-draft',
  waiting: 'status-waiting',
  ready: 'status-ready',
  done: 'status-done',
  cancelled: 'status-cancelled',
};

const OperationsView = ({ type, title, description }) => {
  const [operations, setOperations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [newOp, setNewOp] = useState({
    partner_name: '',
    source_location_id: '',
    dest_location_id: '',
    notes: '',
    lines: [{ product_id: '', demand_qty: 1, done_qty: 0 }]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { type };
      if (filterStatus) params.status = filterStatus;
      const [opsRes, locsRes, prodsRes] = await Promise.all([
        api.get('/operations', { params }),
        api.get('/locations'),
        api.get('/products'),
      ]);
      setOperations(opsRes.data.operations);
      setLocations(locsRes.data.locations);
      setProducts(prodsRes.data.products);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [type, filterStatus]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/operations', { ...newOp, type });
      setIsModalOpen(false);
      setNewOp({ partner_name: '', source_location_id: '', dest_location_id: '', notes: '', lines: [{ product_id: '', demand_qty: 1, done_qty: 0 }] });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create operation');
    }
  };

  const handleValidate = async (id) => {
    try {
      await api.post(`/operations/${id}/validate`);
      fetchData();
      setSelectedOp(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to validate');
    }
  };

  const addLine = () => setNewOp(prev => ({ ...prev, lines: [...prev.lines, { product_id: '', demand_qty: 1, done_qty: 0 }] }));
  const removeLine = (i) => setNewOp(prev => ({ ...prev, lines: prev.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i, field, val) => setNewOp(prev => {
    const lines = [...prev.lines];
    lines[i] = { ...lines[i], [field]: val };
    return { ...prev, lines };
  });

  return (
    <div className="page-container" style={{animation: 'fadeIn 0.3s ease-out'}}>
      <div className="page-actions">
        <div>
          <h1 style={{fontSize: 'var(--font-size-xl)'}}>{title}</h1>
          <p style={{color: 'var(--color-text-muted)'}}>{description}</p>
        </div>
        <div style={{display:'flex', gap:'var(--space-3)'}}>
          <select className="form-input" style={{width:'auto'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th><th>Status</th><th>From</th><th>To</th><th>Partner</th><th>Date</th><th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {operations.map(op => (
                <tr key={op.id}>
                  <td style={{fontFamily:'monospace', color:'var(--color-primary)', fontWeight:600}}>{op.reference}</td>
                  <td><span className={`status-badge ${STATUS_MAP[op.status] || ''}`}>{op.status}</span></td>
                  <td style={{color:'var(--color-text-muted)', fontSize:'var(--font-size-xs)'}}>{op.source_location_name || '-'}</td>
                  <td style={{color:'var(--color-text-muted)', fontSize:'var(--font-size-xs)'}}>{op.dest_location_name || '-'}</td>
                  <td>{op.partner_name || '-'}</td>
                  <td style={{color:'var(--color-text-subtle)', fontSize:'var(--font-size-xs)'}}>{new Date(op.created_at * 1000).toLocaleDateString()}</td>
                  <td style={{textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'8px'}}>
                    <button className="btn btn-secondary" onClick={() => setSelectedOp(op)}>View</button>
                    {op.status !== 'done' && op.status !== 'cancelled' && (
                      <button className="btn btn-accent" onClick={() => handleValidate(op.id)}>Validate</button>
                    )}
                  </td>
                </tr>
              ))}
              {operations.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:'center', padding:'var(--space-6)', color:'var(--color-text-muted)'}}>No {title.toLowerCase()} found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{maxWidth:'680px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New {title.slice(0, -1)}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{display:'flex', flexDirection:'column', gap:'var(--space-4)'}}>
                <div style={{display:'flex', gap:'var(--space-4)'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Source Location</label>
                    <select required className="form-input" value={newOp.source_location_id} onChange={e => setNewOp({...newOp, source_location_id: e.target.value})}>
                      <option value="">-- Select --</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Destination Location</label>
                    <select required className="form-input" value={newOp.dest_location_id} onChange={e => setNewOp({...newOp, dest_location_id: e.target.value})}>
                      <option value="">-- Select --</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Partner / Vendor / Customer (optional)</label>
                  <input className="form-input" value={newOp.partner_name} onChange={e => setNewOp({...newOp, partner_name: e.target.value})} placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-2)'}}>
                    <label className="form-label" style={{margin:0}}>Product Lines</label>
                    <button type="button" className="btn btn-secondary" style={{padding:'4px 10px', fontSize:'12px'}} onClick={addLine}>+ Add Line</button>
                  </div>
                  {newOp.lines.map((line, i) => (
                    <div key={i} style={{display:'flex', gap:'var(--space-3)', alignItems:'center', marginBottom:'var(--space-2)'}}>
                      <select required className="form-input" style={{flex:2}} value={line.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)}>
                        <option value="">-- Product --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" className="form-input" style={{flex:1}} value={line.demand_qty} onChange={e => updateLine(i, 'demand_qty', parseFloat(e.target.value) || 0)} min={0} placeholder="Qty" />
                      {newOp.lines.length > 1 && (
                        <button type="button" className="btn btn-danger" style={{padding:'6px 10px'}} onClick={() => removeLine(i)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows="2" value={newOp.notes} onChange={e => setNewOp({...newOp, notes: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Operation Detail */}
      {selectedOp && (
        <div className="modal-overlay" onClick={() => setSelectedOp(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{flexDirection:'column', alignItems:'stretch', gap:'var(--space-4)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', gap:'var(--space-2)', alignItems:'center'}}>
                  <h2 style={{margin:0}}>{selectedOp.reference}</h2>
                  <span className={`status-badge ${STATUS_MAP[selectedOp.status]}`}>{selectedOp.status}</span>
                </div>
                <div style={{display:'flex', gap:'var(--space-2)'}}>
                  {selectedOp.status !== 'done' && selectedOp.status !== 'cancelled' && (
                    <button className="btn btn-primary" onClick={() => handleValidate(selectedOp.id)}>Validate</button>
                  )}
                  <button className="btn btn-secondary" onClick={() => window.print()}>Print</button>
                  {selectedOp.status === 'draft' && (
                    <button className="btn btn-danger" style={{padding:'6px 12px'}} onClick={() => setSelectedOp(null)}>Cancel</button>
                  )}
                  <button className="modal-close" onClick={() => setSelectedOp(null)}>&times;</button>
                </div>
              </div>

              <div className="status-pipeline">
                <div className={`pipeline-step ${['draft', 'waiting', 'ready', 'done'].includes(selectedOp.status) ? 'active' : ''}`}>Draft</div>
                <div className="pipeline-arrow"></div>
                <div className={`pipeline-step ${['waiting', 'ready', 'done'].includes(selectedOp.status) ? 'active' : ''}`}>Waiting</div>
                <div className="pipeline-arrow"></div>
                <div className={`pipeline-step ${['ready', 'done'].includes(selectedOp.status) ? 'active' : ''}`}>Ready</div>
                <div className="pipeline-arrow"></div>
                <div className={`pipeline-step ${selectedOp.status === 'done' ? 'active' : ''}`}>Done</div>
              </div>
            </div>
            <div className="modal-body" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-6)'}}>
              <div>
                <div className="info-group">
                  <label className="info-label">Partner</label>
                  <div className="info-value">{selectedOp.partner_name || '-'}</div>
                </div>
                <div className="info-group" style={{marginTop:'var(--space-4)'}}>
                  <label className="info-label">Source Location</label>
                  <div className="info-value">{selectedOp.source_location_name}</div>
                </div>
                <div className="info-group" style={{marginTop:'var(--space-4)'}}>
                  <label className="info-label">Responsible</label>
                  <div className="info-value">Admin</div>
                </div>
              </div>
              <div>
                <div className="info-group">
                  <label className="info-label">Scheduled Date</label>
                  <div className="info-value">{new Date(selectedOp.created_at * 1000).toLocaleDateString()}</div>
                </div>
                <div className="info-group" style={{marginTop:'var(--space-4)'}}>
                  <label className="info-label">Destination Location</label>
                  <div className="info-value">{selectedOp.dest_location_name}</div>
                </div>
                <div className="info-group" style={{marginTop:'var(--space-4)'}}>
                  <label className="info-label">Operation Type</label>
                  <div className="info-value" style={{textTransform:'capitalize'}}>{type}</div>
                </div>
              </div>
            </div>
            <div style={{padding:'0 var(--space-6) var(--space-6)'}}>
              <h3 style={{fontSize:'var(--font-size-sm)', marginBottom:'var(--space-3)'}}>Product Lines</h3>
              <table className="data-table" style={{border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)'}}>
                <thead>
                  <tr>
                    <th>Product</th><th>Demand</th><th>Done</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="3" style={{textAlign:'center', color:'var(--color-text-muted)'}}>Line items loaded successfully</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsView;
