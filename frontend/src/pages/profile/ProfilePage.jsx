import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import '../../styles/components.css';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="page-container" style={{animation: 'fadeIn 0.3s ease-out', maxWidth: 600}}>
      <div style={{marginBottom: 'var(--space-6)'}}>
        <h1 style={{fontSize: 'var(--font-size-xl)'}}>Profile</h1>
        <p style={{color: 'var(--color-text-muted)'}}>Your account information</p>
      </div>

      <div style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)'}}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{fontSize: 'var(--font-size-xl)', fontWeight: 700}}>{user?.name || 'Unknown'}</div>
            <div style={{color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)'}}>@{user?.username || '-'}</div>
          </div>
        </div>

        <div style={{display: 'grid', gap: 'var(--space-4)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)'}}>
            <span style={{color: 'var(--color-text-muted)'}}>Name</span>
            <span style={{fontWeight: 500}}>{user?.name || '-'}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)'}}>
            <span style={{color: 'var(--color-text-muted)'}}>Username</span>
            <span style={{fontWeight: 500}}>{user?.username || '-'}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0'}}>
            <span style={{color: 'var(--color-text-muted)'}}>Role</span>
            <span style={{
              padding: '2px 10px', borderRadius: '12px',
              background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)',
              fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase'
            }}>
              {user?.role || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
