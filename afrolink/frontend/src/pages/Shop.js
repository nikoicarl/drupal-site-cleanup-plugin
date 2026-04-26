import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import PageLayout from '../components/common/PageLayout';

const CATEGORIES = ['Groceries','Spices','Meal Kits','Beverages','Snacks','Crafts','Fashion','Frozen'];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { add }                 = useCart();

  const category = searchParams.get('category') || '';
  const page     = Number(searchParams.get('page') || 1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 12, page });
    if (category) params.set('category', category);
    if (search)   params.set('search', search);
    api.get(`/products?${params}`)
      .then(r => setProducts(r.data?.data ?? []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [category, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = e => { e.preventDefault(); load(); };
  const addToCart = (p, e) => {
    e.preventDefault();
    add({ id: p.id, name: p.name, base_price: p.base_price, sale_price: p.sale_price, image_url: p.image_url, vendor_name: p.vendor_name });
    toast.success(`${p.name} added to cart`);
  };

  return (
    <PageLayout>
      <div className="al-page">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
          <div>
            <h1 className="al-page-title">Shop</h1>
            <p className="al-page-sub" style={{margin:0}}>Authentic African products from trusted local vendors</p>
          </div>
          <form onSubmit={handleSearch} style={{display:'flex',gap:8}}>
            <div className="al-search-bar" style={{minWidth:280}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…"/>
              <button type="submit"><i className="fa-solid fa-magnifying-glass"/></button>
            </div>
          </form>
        </div>

        <div className="al-shop-layout">
          {/* Filters */}
          <aside className="al-filters">
            <div className="al-filter-group">
              <div className="al-filter-title">Category</div>
              <label className="al-filter-option">
                <input type="radio" name="cat" checked={category===''} onChange={()=>setSearchParams({})}/>All
              </label>
              {CATEGORIES.map(c=>(
                <label key={c} className="al-filter-option">
                  <input type="radio" name="cat" checked={category===c.toLowerCase().replace(/ /g,'-')}
                    onChange={()=>setSearchParams({category:c.toLowerCase().replace(/ /g,'-')})}/>
                  {c}
                </label>
              ))}
            </div>
            <div className="al-filter-group">
              <div className="al-filter-title">Price Range</div>
              <div className="al-price-range">
                <div className="al-form-input" style={{padding:'8px 10px',fontSize:'0.82rem'}}>Min</div>
                <div className="al-form-input" style={{padding:'8px 10px',fontSize:'0.82rem'}}>Max</div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div>
            {loading ? (
              <div style={{textAlign:'center',padding:'60px 0',color:'var(--text-muted)'}}>
                <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',marginBottom:12,display:'block'}}/>Loading products…
              </div>
            ) : products.length === 0 ? (
              <div className="al-empty">
                <i className="fa-solid fa-box-open"/>
                <p>No products found</p>
                <button className="al-btn-sm outline" onClick={()=>{setSearch('');setSearchParams({});}}>Clear filters</button>
              </div>
            ) : (
              <div className="al-product-grid">
                {products.map(p=>(
                  <Link key={p.id} to={`/shop/${p.id}`} className="al-product-card">
                    <div className="al-product-img">
                      {p.sale_price && <span className="al-product-badge">Sale</span>}
                      {p.image_url ? <img src={p.image_url} alt={p.name}/> : <i className="fa-solid fa-box-open placeholder"/>}
                    </div>
                    <div className="al-product-info">
                      <div className="al-product-vendor">{p.vendor_name}</div>
                      <div className="al-product-name">{p.name}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
                        <div>
                          <span className="al-product-price">${parseFloat(p.sale_price??p.base_price).toFixed(2)}</span>
                          {p.sale_price && <span className="al-product-price-orig">${parseFloat(p.base_price).toFixed(2)}</span>}
                        </div>
                        <button className="al-btn-sm primary" style={{padding:'6px 10px',fontSize:'0.75rem'}}
                          onClick={e=>addToCart(p,e)}>
                          <i className="fa-solid fa-plus"/>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
