import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  {
    value: 'customer',
    label: 'Customer',
    desc: 'Browse & buy',
    icon: 'fa-solid fa-user',
  },
  {
    value: 'vendor',
    label: 'Vendor',
    desc: 'Sell products',
    icon: 'fa-solid fa-store',
  },
  {
    value: 'driver',
    label: 'Driver',
    desc: 'Deliver & earn',
    icon: 'fa-solid fa-motorcycle',
  },
];

const CITIES = [
  'Ottawa, ON', 'Toronto, ON', 'Montreal, QC', 'Vancouver, BC',
  'Calgary, AB', 'Edmonton, AB', 'Winnipeg, MB', 'Halifax, NS',
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole    = searchParams.get('role') || 'customer';

  const [form, setForm]       = useState({
    firstName: '', lastName: '', email: '', password: '',
    city: 'Ottawa, ON', role: defaultRole,
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { register }          = useAuth();
  const navigate              = useNavigate();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const handleChange = e => set(e.target.name, e.target.value);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form);
      const redirects = { vendor: '/vendor', driver: '/driver', customer: '/account' };
      navigate(redirects[user.role] || '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
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

          <div className="al-auth-illustration">
            <div className="al-auth-illustration-inner">
              <svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
                {/* Bowl with food */}
                <circle cx="60" cy="68" r="30" fill="#C4622D" opacity="0.25"/>
                <path d="M36 68 Q60 88 84 68" stroke="#A0522D" strokeWidth="3" fill="none"/>
                {/* African pattern band */}
                <rect x="36" y="60" width="48" height="14" rx="2" fill="#8B4513" opacity="0.5"/>
                <path d="M36 62 L44 74 L52 62 L60 74 L68 62 L76 74 L84 62" stroke="#FBBF74" strokeWidth="1.5" fill="none" opacity="0.8"/>
                {/* Steam lines */}
                <path d="M50 54 Q53 44 50 34" stroke="#C4622D" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>
                <path d="M60 52 Q63 42 60 32" stroke="#C4622D" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>
                <path d="M70 54 Q73 44 70 34" stroke="#C4622D" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>
                {/* Hands */}
                <path d="M26 72 Q30 68 34 70" stroke="#7C3D12" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M86 70 Q90 68 94 72" stroke="#7C3D12" strokeWidth="3" fill="none" strokeLinecap="round"/>
                {/* Stars */}
                <text x="20" y="40" fontSize="10" fill="#FBBF74" opacity="0.6">✦</text>
                <text x="88" y="32" fontSize="8" fill="#FBBF74" opacity="0.5">✦</text>
                <text x="15" y="60" fontSize="6" fill="#C4622D" opacity="0.5">✦</text>
              </svg>
            </div>
          </div>

          <h2>Join the AfroLink<br />Community</h2>
          <p>Connect, shop & grow together.</p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="al-auth-right" style={{ padding: '32px 64px', alignItems: 'flex-start', overflowY: 'auto' }}>
        <div className="al-auth-form-box" style={{ paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ margin: 0 }}>Join AfroLink</h1>
            <Link to="/" style={{
              width: 36, height: 36, borderRadius: 8, background: 'var(--brand-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem',
            }}>
              <i className="fa-solid fa-xmark" />
            </Link>
          </div>

          {/* Role Selector */}
          <div className="al-role-grid">
            {ROLES.map(r => (
              <div
                key={r.value}
                className={`al-role-card ${form.role === r.value ? 'active' : ''}`}
                onClick={() => set('role', r.value)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && set('role', r.value)}>
                <i className={`${r.icon} role-icon`} />
                <span className="role-label">{r.label}</span>
                <span className="role-desc">{r.desc}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name Row */}
            <div className="al-form-group">
              <div className="al-name-row">
                <div>
                  <label className="al-form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className="al-form-input"
                    placeholder="First name"
                    required
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="al-form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className="al-form-input"
                    placeholder="Last name"
                    required
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

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
                  autoComplete="new-password"
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

            <div className="al-form-group">
              <label className="al-form-label">City</label>
              <select name="city" className="al-select" value={form.city} onChange={handleChange}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" className="al-btn-primary" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />Creating account…</>
                : 'Create My Account'}
            </button>

            <p className="al-terms">
              By joining you agree to our{' '}
              <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </form>

          <div className="al-divider" style={{ margin: '0 0 16px' }}>or sign up with</div>

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

          <p className="al-auth-footer" style={{ marginTop: 16 }}>
            Already have an account?{' '}
            <Link to="/login">Sign in <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }} /></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
