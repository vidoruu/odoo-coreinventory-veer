import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

const TopBar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-search">
        <input type="text" placeholder="Search products, orders..." />
      </div>
      <div className="topbar-actions" style={{display: 'flex', alignItems: 'center', gap: 'var(--space-3)'}}>
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <div 
            className="topbar-user-info" 
            style={{display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer'}}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div style={{fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontWeight: 500}}>
              {user?.name || 'User'}
            </div>
            <div className="topbar-avatar" style={{cursor: 'pointer'}}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div style={{padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-2)'}}>
                <div style={{fontSize: 'var(--font-size-sm)', fontWeight: 600}}>{user?.name}</div>
                <div style={{fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)'}}>{user?.role === 'admin' ? 'Administrator' : 'Employee'}</div>
              </div>
              
              <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                Profile Settings
              </Link>
              
              {user?.role === 'admin' && (
                <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  System Settings
                </Link>
              )}

              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
