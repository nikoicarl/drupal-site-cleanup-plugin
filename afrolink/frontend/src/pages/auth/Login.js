import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const location              = useLocation();
  const from                  = location.state?.from?.pathname || '/';

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const redirects = { vendor: '/vendor', driver: '/driver', admin: '/admin', customer: '/account' };
      navigate(redirects[user.role] || from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="al-auth-wrap">
      {/* ── Left Panel ── */}
      <div className="al-auth-left">
        <div className="al-auth-pattern" />
        <div className="al-auth-left-content">
          <div className="al-auth-logo-badge">
            <i className="fa-solid fa-earth-africa" />
            AfroLink
          </div>

          {/* Decorative illustration placeholder */}
          <div className="al-auth-illustration">
            <div className="al-auth-illustration-inner">
              <svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
                {/* Bowl */}
                <ellipse cx="60" cy="88" rx="36" ry="10" fill="#C4622D" opacity="0.3"/>
                <path d="M28 72 Q60 96 92 72" stroke="#A0522D" strokeWidth="3" fill="none"/>
                {/* Steam */}
                <path d="M44 64 Q48 54 44 44" stroke="#C4622D" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
                <path d="M60 60 Q64 50 60 40" stroke="#C4622D" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
                <path d="M76 64 Q80 54 76 44" stroke="#C4622D" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
                {/* Spoon */}
                <line x1="82" y1="48" x2="50" y2="80" stroke="#7C3D12" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="82" cy="46" r="6" fill="#A0522D" opacity="0.7"/>
                {/* Pot body */}
                <path d="M24 72 Q24 56 60 56 Q96 56 96 72 Z" fill="#8B4513" opacity="0.7"/>
                <ellipse cx="60" cy="56" rx="36" ry="8" fill="#A0522D"/>
                <rect x="18" y="68" width="10" height="6" rx="3" fill="#7C3D12" opacity="0.8"/>
                <rect x="92" y="68" width="10" height="6" rx="3" fill="#7C3D12" opacity="0.8"/>
              </svg>
            </div>
          </div>

          <h2>Welcome back<br />to AfroLink</h2>
          <p>Taste of home, delivered.</p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="al-auth-right">
        <div className="al-auth-form-box">
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to shop, manage orders and connect with the community.</p>

          <form onSubmit={handleSubmit}>
            <div className="al-form-group">
              <label className="al-form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="al-form-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="al-form-group">
              <label className="al-form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  className="al-form-input"
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '0.9rem', padding: 0,
                  }}>
                  <i className={`fa-regular ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className="al-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="al-btn-primary" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />Signing in…</>
                : 'Sign In to AfroLink'}
            </button>
          </form>

          <div className="al-divider">or continue with</div>

          <div className="al-social-row">
            <button type="button" className="al-social-btn al-social-google">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Google
            </button>
            <button type="button" className="al-social-btn al-social-facebook">
              <i className="fa-brands fa-facebook" style={{ fontSize: '1.1rem' }} />
              facebook
            </button>
          </div>

          <div className="al-trust-badge">
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '1rem' }} />
            Secured by SSL · Trusted by 1,200+ members
          </div>

          <p className="al-auth-footer">
            No account?{' '}
            <Link to="/register">Join free <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }} /></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
