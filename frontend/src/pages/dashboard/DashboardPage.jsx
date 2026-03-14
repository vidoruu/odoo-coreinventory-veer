import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/components.css';
import '../../styles/dashboard.css';

const KpiCard = ({ label, value, sub, accent }) => (
  <div className="kpi-card">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value" style={accent ? { color: accent } : {}}>{value ?? 0}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
  </div>
);

const QuickLink = ({ to, label, description }) => (
  <Link to={to} className="quick-action-btn">
    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{label}</div>
    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', marginTop: '2px' }}>{description}</div>
  </Link>
);

const DashboardPage = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const res = await api.get('/dashboard/kpis');
        setKpis(res.data);
      } catch (err) {
        // Dashboard stats fetch error
      } finally {
        setLoading(false);
      }
    };
    fetchKpis();
  }, []);

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
          Real-time snapshot of your inventory operations
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : (
        <>
      <div className="dashboard-main-cards">
            <Link to="/receipts" className="action-card receipt-card">
              <div className="action-card-title">Receipts</div>
              <div className="action-card-stats">
                <span className="count">{kpis?.pendingReceipts || 0}</span>
                <span className="label">To Receive</span>
              </div>
              <div className="action-card-footer">
                Manage incoming stock shipments
              </div>
            </Link>

            <Link to="/deliveries" className="action-card delivery-card">
              <div className="action-card-title">Deliveries</div>
              <div className="action-card-stats">
                <span className="count">{kpis?.pendingDeliveries || 0}</span>
                <span className="label">To Deliver</span>
              </div>
              <div className="action-card-footer">
                Manage outgoing customer orders
              </div>
            </Link>
          </div>

          {/* Secondary Stats */}
          <div className="kpi-grid" style={{ marginTop: 'var(--space-6)' }}>
            <KpiCard label="Total Products" value={kpis?.totalProducts} sub="In catalog" />
            <KpiCard label="Low Stock" value={kpis?.lowStock} sub="Needs attention" accent="var(--color-danger)" />
            <KpiCard label="Internal Transfers" value={kpis?.pendingTransfers} sub="Scheduled moves" />
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section" style={{ marginTop: 'var(--space-8)' }}>
            <div className="dashboard-section-title">Operations Menu</div>
            <div className="quick-actions">
              <QuickLink to="/transfers"   label="Transfers"   description="Internal movement" />
              <QuickLink to="/adjustments" label="Inventory"  description="Stock adjustments" />
              <QuickLink to="/products"    label="Products"   description="Manage catalog" />
              <QuickLink to="/move-history" label="History"    description="Stock moves log" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
