import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function PageLayout({ children }) {
  const { user, logout } = useAuth();
  const { count }        = useCart();
  const navigate         = useNavigate();

  const portalLink = () => {
    if (!user) return '/account';
    return { vendor: '/vendor', driver: '/driver', admin: '/admin', customer: '/account' }[user.role] || '/account';
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      <nav className="al-nav">
        <Link to="/" className="al-nav-logo">
          <span className="globe"><i className="fa-solid fa-earth-africa" /></span>
          AfroLink
        </Link>
        <div className="al-nav-links">
          <Link to="/shop"><i className="fa-solid fa-shop" style={{marginRight:5}}/>Shop</Link>
          <Link to="/community"><i className="fa-solid fa-users" style={{marginRight:5}}/>Community</Link>
          <Link to="/community?tab=recipes"><i className="fa-solid fa-bowl-food" style={{marginRight:5}}/>Recipes</Link>
        </div>
        <div className="al-nav-actions">
          <Link to="/shop" className="al-nav-icon-btn" title="Search">
            <i className="fa-solid fa-magnifying-glass" />
          </Link>
          <Link to="/cart" className="al-nav-icon-btn" title="Cart" style={{position:'relative'}}>
            <i className="fa-solid fa-cart-shopping" />
            {count > 0 && <span className="al-cart-badge">{count}</span>}
          </Link>
          {user ? (
            <div style={{position:'relative'}} className="al-dropdown-wrap">
              <button className="al-nav-icon-btn" title="Account" onClick={e => e.currentTarget.closest('.al-dropdown-wrap').classList.toggle('open')}>
                <i className="fa-solid fa-circle-user" />
              </button>
              <div className="al-dropdown">
                <div className="al-dropdown-header">
                  <div style={{fontWeight:800,fontSize:'0.85rem',color:'var(--text-primary)'}}>{user.email}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-muted)',textTransform:'capitalize'}}>{user.role}</div>
                </div>
                <Link to={portalLink()} className="al-dropdown-item" onClick={e => e.currentTarget.closest('.al-dropdown-wrap').classList.remove('open')}>
                  <i className="fa-solid fa-gauge-high"/>My Dashboard
                </Link>
                <Link to="/account/orders" className="al-dropdown-item" onClick={e => e.currentTarget.closest('.al-dropdown-wrap').classList.remove('open')}>
                  <i className="fa-solid fa-bag-shopping"/>My Orders
                </Link>
                <div className="al-dropdown-divider"/>
                <button className="al-dropdown-item danger" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"/>Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login"    className="al-nav-btn-login">Sign in</Link>
              <Link to="/register" className="al-nav-btn-register">Join free</Link>
            </>
          )}
        </div>
      </nav>

      <main style={{minHeight:'calc(100vh - 64px - 80px)'}}>
        {children}
      </main>

      <footer style={{background:'var(--brand-dark)',color:'rgba(255,255,255,0.5)',padding:'20px 40px',textAlign:'center',fontSize:'0.8rem',fontWeight:500}}>
        © {new Date().getFullYear()} AfroLink Inc. — All rights reserved. &nbsp;·&nbsp;
        <Link to="/terms" style={{color:'inherit'}}>Terms</Link> &nbsp;·&nbsp;
        <Link to="/privacy" style={{color:'inherit'}}>Privacy</Link>
      </footer>
    </>
  );
}
