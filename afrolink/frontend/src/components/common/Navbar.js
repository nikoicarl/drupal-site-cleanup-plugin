import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const BRAND_COLOR = '#6B3A2A';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const portalLink = () => {
    if (!user) return null;
    const links = { vendor: '/vendor', driver: '/driver', admin: '/admin', customer: '/account' };
    return links[user.role] || '/account';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" style={{ color: BRAND_COLOR }}>
          🌍 AfroLink
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navmenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/shop">Shop</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/community">Community</Link></li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Cart */}
            <Link to="/cart" className="position-relative text-decoration-none text-dark">
              <i className="bi bi-bag fs-5" />
              {count > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                  style={{ backgroundColor: BRAND_COLOR, fontSize: '0.6rem' }}>
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="dropdown">
                <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                  {user.email}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to={portalLink()}>My Dashboard</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}>Sign out</button></li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline-secondary">Sign in</Link>
                <Link to="/register" className="btn btn-sm text-white" style={{ backgroundColor: BRAND_COLOR }}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
