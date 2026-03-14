import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/components.css';

const MoveHistoryPage = () => {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoves = async () => {
      try {
        const res = await api.get('/moves');
        setMoves(res.data.moves);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchMoves();
  }, []);

  return (
    <div className="page-container" style={{animation: 'fadeIn 0.3s ease-out'}}>
      <div style={{marginBottom: 'var(--space-6)'}}>
        <h1 style={{fontSize: 'var(--font-size-xl)'}}>Move History</h1>
        <p style={{color: 'var(--color-text-muted)'}}>Immutable ledger of all stock movements</p>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th><th>Date</th><th>From</th><th>To</th><th>Product</th><th>Quantity</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {moves.map(m => (
                <tr key={m.id}>
                  <td style={{fontFamily:'monospace', color:'var(--color-primary)', fontSize:'var(--font-size-xs)', fontWeight:600}}>{m.reference || '-'}</td>
                  <td style={{color:'var(--color-text-subtle)', fontSize:'var(--font-size-xs)'}}>{new Date(m.created_at * 1000).toLocaleDateString()}</td>
                  <td style={{color:'var(--color-text-muted)', fontSize:'var(--font-size-xs)'}}>{m.source_location_name || '-'}</td>
                  <td style={{color:'var(--color-text-muted)', fontSize:'var(--font-size-xs)'}}>{m.dest_location_name || '-'}</td>
                  <td style={{fontWeight:500}}>{m.product_name || '-'}</td>
                  <td style={{fontWeight:600}}>{m.quantity}</td>
                  <td><span className="status-badge status-done">Done</span></td>
                </tr>
              ))}
              {moves.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:'center', padding:'var(--space-6)', color:'var(--color-text-muted)'}}>No stock moves recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MoveHistoryPage;
