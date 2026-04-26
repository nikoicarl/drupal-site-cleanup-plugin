import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
  { label: 'All',       icon: 'fa-solid fa-border-all',       slug: '' },
  { label: 'Groceries', icon: 'fa-solid fa-basket-shopping',  slug: 'groceries' },
  { label: 'Spices',    icon: 'fa-solid fa-pepper-hot',       slug: 'spices' },
  { label: 'Meal Kits', icon: 'fa-solid fa-bowl-food',        slug: 'meal-kits' },
  { label: 'Beverages', icon: 'fa-solid fa-mug-hot',          slug: 'beverages' },
  { label: 'Snacks',    icon: 'fa-solid fa-cookie-bite',      slug: 'snacks' },
  { label: 'Crafts',    icon: 'fa-solid fa-palette',          slug: 'crafts' },
  { label: 'Fashion',   icon: 'fa-solid fa-shirt',            slug: 'fashion' },
];

const HOW_IT_WORKS = [
  {
    icon: 'fa-solid fa-magnifying-glass',
    title: 'Discover',
    desc: 'Browse hundreds of authentic African products and ingredients from trusted local vendors.',
  },
  {
    icon: 'fa-solid fa-bag-shopping',
    title: 'Order',
    desc: 'Add to cart, apply promo codes, and checkout securely in just a few taps.',
  },
  {
    icon: 'fa-solid fa-truck-fast',
    title: 'Delivered',
    desc: 'Your order is picked up and delivered fresh to your door by our community drivers.',
  },
];

export default function Home() {
  const [featured, setFeatured]   = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const { user }                  = useAuth();
  const cart                      = useCart();
  const cartCount                 = cart?.items?.length ?? 0;

  useEffect(() => {
    const url = activeCategory
      ? `/products?limit=8&category=${activeCategory}`
      : '/products?limit=8';
    api.get(url).then(r => setFeatured(r.data?.data ?? [])).catch(() => {});
  }, [activeCategory]);

  return (
    <>
      {/* ── Navbar ───────────────────────────── */}
      <nav className="al-nav">
        <Link to="/" className="al-nav-logo">
          <span className="globe"><i className="fa-solid fa-earth-africa" /></span>
          AfroLink
        </Link>

        <div className="al-nav-links">
          <Link to="/shop"><i className="fa-solid fa-shop" style={{ marginRight: 5 }} />Shop</Link>
          <Link to="/community"><i className="fa-solid fa-users" style={{ marginRight: 5 }} />Community</Link>
          <Link to="/community?tab=recipes"><i className="fa-solid fa-bowl-food" style={{ marginRight: 5 }} />Recipes</Link>
        </div>

        <div className="al-nav-actions">
          <Link to="/shop" className="al-nav-icon-btn" title="Search">
            <i className="fa-solid fa-magnifying-glass" />
          </Link>

          <Link to="/cart" className="al-nav-icon-btn" title="Cart" style={{ position: 'relative' }}>
            <i className="fa-solid fa-cart-shopping" />
            {cartCount > 0 && <span className="al-cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <Link to={`/${user.role === 'vendor' ? 'vendor' : user.role === 'driver' ? 'driver' : 'account'}`}
              className="al-nav-icon-btn" title="Account">
              <i className="fa-solid fa-circle-user" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="al-nav-btn-login">Sign in</Link>
              <Link to="/register" className="al-nav-btn-register">Join free</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────── */}
      <section className="al-hero">
        <div className="al-hero-content">
          <div>
            <div className="al-hero-eyebrow">
              <i className="fa-solid fa-earth-africa" />
              Authentic African Marketplace
            </div>

            <h1>
              Shop, Cook &<br />
              Share <em>African</em><br />
              Flavours
            </h1>

            <p className="al-hero-sub">
              Discover authentic products, learn real recipes, and connect<br />
              with African food creators — all in one place.
            </p>

            <div className="al-hero-ctas">
              <Link to="/shop" className="al-hero-cta-primary">
                <i className="fa-solid fa-bag-shopping" />
                Start Shopping
              </Link>
              <Link to="/register?role=vendor" className="al-hero-cta-secondary">
                <i className="fa-solid fa-store" />
                Become a Seller
              </Link>
            </div>

            <div className="al-hero-stats">
              <div className="al-hero-stat">
                <strong>1,200+</strong>
                <span>Members</span>
              </div>
              <div className="al-hero-stat" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
                <strong>400+</strong>
                <span>Products</span>
              </div>
              <div className="al-hero-stat" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
                <strong>50+</strong>
                <span>Vendors</span>
              </div>
            </div>
          </div>

          {/* Floating visual cards */}
          <div className="al-hero-visual">
            <div className="al-hero-card">
              <h4><i className="fa-solid fa-fire" style={{ marginRight: 6 }} />Trending Now</h4>
              <div className="al-product-preview">
                {['🌶️','🍲','🧆','🫘','🌿','🥘'].map((e, i) => (
                  <div key={i} className="al-product-preview-item">{e}</div>
                ))}
              </div>
            </div>
            <div className="al-hero-card al-hero-card-sm">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>
                <i className="fa-solid fa-truck-fast" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 2 }}>
                  Free Delivery
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 500 }}>
                  On orders over $50
                </div>
              </div>
            </div>
            <div className="al-hero-card al-hero-card-sm">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>
                <i className="fa-solid fa-star" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 2 }}>
                  Top Rated
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 500 }}>
                  4.8 ★ avg from 500+ reviews
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Strip ───────────────────── */}
      <div className="al-cats">
        <div className="al-cats-inner">
          {CATEGORIES.map(c => (
            <button
              key={c.slug}
              className={`al-cat-pill ${activeCategory === c.slug ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.slug)}
              style={{ background: 'none', cursor: 'pointer' }}>
              <i className={c.icon} style={{ fontSize: '0.8rem' }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Products ─────────────────── */}
      <div className="al-section">
        <div className="al-section-header">
          <div>
            <h2>Featured Products</h2>
            <p>Handpicked from our best local vendors</p>
          </div>
          <Link to="/shop" className="al-view-all">
            View all <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }} />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="al-product-grid">
            {featured.map(p => (
              <Link key={p.id} to={`/shop/${p.id}`} className="al-product-card">
                <div className="al-product-img">
                  {p.is_featured && <span className="al-product-badge">Featured</span>}
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} />
                    : <i className="fa-solid fa-box-open placeholder" />}
                </div>
                <div className="al-product-info">
                  <div className="al-product-vendor">{p.vendor_name}</div>
                  <div className="al-product-name">{p.name}</div>
                  {p.review_count > 0 && (
                    <div className="al-product-stars">
                      {[1,2,3,4,5].map(s => (
                        <i key={s} className={`fa-${s <= Math.round(p.rating_avg) ? 'solid' : 'regular'} fa-star`} />
                      ))}
                      <span>({p.review_count})</span>
                    </div>
                  )}
                  <div>
                    <span className="al-product-price">
                      ${parseFloat(p.sale_price ?? p.base_price).toFixed(2)}
                    </span>
                    {p.sale_price && (
                      <span className="al-product-price-orig">
                        ${parseFloat(p.base_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--text-muted)',
            border: '2px dashed var(--border-warm)',
            borderRadius: 20,
          }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: '2.5rem', marginBottom: 16, display: 'block', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>Products will appear here once vendors are onboarded.</p>
            <Link to="/register?role=vendor" style={{
              color: 'var(--brand)', fontWeight: 700, textDecoration: 'none',
            }}>
              Become a vendor <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem' }} />
            </Link>
          </div>
        )}
      </div>

      {/* ── How It Works ─────────────────────── */}
      <div className="al-how-bg">
        <div className="al-how-inner">
          <h2>How AfroLink Works</h2>
          <p>From discovery to delivery in three simple steps</p>
          <div className="al-how-grid">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} className="al-how-card">
                <div className="al-how-icon">
                  <i className={h.icon} />
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, borderRadius: 6,
                  background: 'var(--brand-light)', color: 'var(--brand)',
                  fontSize: '0.7rem', fontWeight: 800, marginBottom: 10,
                  border: '1px solid var(--border-warm)',
                }}>
                  {i + 1}
                </div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Community Banner ─────────────────── */}
      <div className="al-community-banner">
        <h2>Learn African Cooking</h2>
        <p>Watch video recipes, discover ingredients, and connect with African food creators.</p>
        <Link to="/community" className="al-community-btn">
          <i className="fa-solid fa-users" />
          Explore Community Hub
        </Link>
      </div>

      {/* ── Vendor CTA ───────────────────────── */}
      <div className="al-vendor-cta">
        <div>
          <h2>Sell Your Products on AfroLink</h2>
          <p>Join 50+ vendors already reaching the African diaspora community across Canada.</p>
        </div>
        <Link to="/register?role=vendor" className="al-vendor-cta-btn">
          <i className="fa-solid fa-store" />
          Start Selling Today
        </Link>
      </div>

      {/* ── Footer ───────────────────────────── */}
      <footer className="al-footer">
        <div className="al-footer-inner">
          <div className="al-footer-top">
            <div>
              <div className="al-footer-brand">
                <span className="al-footer-brand-dot">
                  <i className="fa-solid fa-earth-africa" style={{ color: 'white', fontSize: '0.7rem' }} />
                </span>
                AfroLink
              </div>
              <p className="al-footer-tagline">
                Taste of home, delivered. Authentic African products, recipes,
                and community — all in one place.
              </p>
              <div className="al-footer-social">
                <a href="#x" aria-label="X / Twitter"><i className="fa-brands fa-x-twitter" /></a>
                <a href="#instagram" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
                <a href="#facebook" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                <a href="#tiktok" aria-label="TikTok"><i className="fa-brands fa-tiktok" /></a>
              </div>
            </div>
            <div className="al-footer-col">
              <h5>Shop</h5>
              <Link to="/shop">All Products</Link>
              <Link to="/shop?category=groceries">Groceries</Link>
              <Link to="/shop?category=spices">Spices</Link>
              <Link to="/shop?category=meal-kits">Meal Kits</Link>
            </div>
            <div className="al-footer-col">
              <h5>Community</h5>
              <Link to="/community">Feed</Link>
              <Link to="/community?tab=recipes">Recipes</Link>
              <Link to="/community?tab=videos">Videos</Link>
              <Link to="/community?tab=events">Events</Link>
            </div>
            <div className="al-footer-col">
              <h5>Company</h5>
              <Link to="/about">About</Link>
              <Link to="/register?role=vendor">Become a Vendor</Link>
              <Link to="/register?role=driver">Become a Driver</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>

          <div className="al-footer-bottom">
            <span>© {new Date().getFullYear()} AfroLink Inc. — All rights reserved.</span>
            <span style={{ display: 'flex', gap: 20 }}>
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-shield-halved" style={{ color: '#4CAF50', fontSize: '0.85rem' }} />
                Secured by SSL
              </span>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
