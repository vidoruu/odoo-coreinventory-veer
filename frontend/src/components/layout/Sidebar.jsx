import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
        <img src="/logo.png" alt="Atlas" style={{ height: 28, objectFit: 'contain' }} />
        <span className="sidebar-logo-text">Atlas</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
          Stock
        </NavLink>

        <div className="sidebar-section-label">Operations</div>
        <NavLink to="/receipts" className={({ isActive }) => isActive ? 'active' : ''}>
          Receipts
        </NavLink>
        <NavLink to="/deliveries" className={({ isActive }) => isActive ? 'active' : ''}>
          Deliveries
        </NavLink>
        <NavLink to="/transfers" className={({ isActive }) => isActive ? 'active' : ''}>
          Transfers
        </NavLink>
        <NavLink to="/adjustments" className={({ isActive }) => isActive ? 'active' : ''}>
          Adjustments
        </NavLink>
        <NavLink to="/move-history" className={({ isActive }) => isActive ? 'active' : ''}>
          Move History
        </NavLink>

        <div className="sidebar-section-label">Config</div>
        {user?.role === 'admin' && (
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            Settings
          </NavLink>
        )}
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
          Profile
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
