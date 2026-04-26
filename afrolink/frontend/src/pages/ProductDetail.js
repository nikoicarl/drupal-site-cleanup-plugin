import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import PageLayout from '../components/common/PageLayout';

export default function ProductDetail() {
  const { id }          = useParams();
  const [p, setP]       = useState(null);
  const [qty, setQty]   = useState(1);
  const [loading, setLoading] = useState(true);
  const { add }         = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then(r => setP(r.data)).catch(() => toast.error('Product not found')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLayout><div style={{textAlign:'center',padding:'80px',color:'var(--text-muted)'}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem'}}/></div></PageLayout>;
  if (!p) return <PageLayout><div className="al-page al-empty"><i className="fa-solid fa-box-open"/><p>Product not found</p><Link to="/shop" className="al-btn-sm primary">Back to Shop</Link></div></PageLayout>;

  const price = p.sale_price ?? p.base_price;
  const inStock = p.allow_backorder || p.quantity_available > 0;

  return (
    <PageLayout>
      <div className="al-page">
        <Link to="/shop" style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--text-muted)',textDecoration:'none',fontSize:'0.85rem',fontWeight:700,marginBottom:24}}>
          <i className="fa-solid fa-arrow-left"/> Back to Shop
        </Link>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'start'}}>
          {/* Images */}
          <div>
            <div style={{height:400,borderRadius:20,background:'var(--brand-light)',overflow:'hidden',marginBottom:12,border:'1.5px solid var(--border-warm)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {p.images?.[0]?.url
                ? <img src={p.images[0].url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <i className="fa-solid fa-image" style={{fontSize:'4rem',opacity:0.2}}/>}
            </div>
            {p.images?.length > 1 && (
              <div style={{display:'flex',gap:8}}>
                {p.images.slice(1,5).map((img,i)=>(
                  <div key={i} style={{width:80,height:80,borderRadius:10,overflow:'hidden',border:'1.5px solid var(--border-warm)',flexShrink:0}}>
                    <img src={img.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{fontSize:'0.75rem',fontWeight:800,letterSpacing:'0.8px',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:6}}>{p.category}</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',fontWeight:700,color:'var(--brand-dark)',margin:'0 0 8px'}}>{p.name}</h1>
            <div style={{color:'var(--text-muted)',fontWeight:600,fontSize:'0.88rem',marginBottom:16}}>by {p.vendor_name}</div>

            {p.review_count > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div style={{display:'flex',gap:2}}>
                  {[1,2,3,4,5].map(s=><i key={s} className={`fa-${s<=Math.round(p.rating_avg)?'solid':'regular'} fa-star`} style={{color:'#F59E0B',fontSize:'0.85rem'}}/>)}
                </div>
                <span style={{fontSize:'0.82rem',color:'var(--text-muted)',fontWeight:600}}>({p.review_count} reviews)</span>
              </div>
            )}

            <div style={{marginBottom:24}}>
              <span style={{fontSize:'2rem',fontWeight:800,color:'var(--brand)'}}>${parseFloat(price).toFixed(2)}</span>
              {p.sale_price && <span style={{fontSize:'1.1rem',color:'var(--text-muted)',textDecoration:'line-through',marginLeft:10,fontWeight:600}}>${parseFloat(p.base_price).toFixed(2)}</span>}
            </div>

            <p style={{color:'var(--text-muted)',lineHeight:1.7,fontWeight:500,fontSize:'0.92rem',marginBottom:24}}>{p.description}</p>

            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <i className={`fa-solid fa-circle${inStock?'-check':'-xmark'}`} style={{color:inStock?'#2E7D32':'#C62828',fontSize:'0.9rem'}}/>
              <span style={{fontSize:'0.82rem',fontWeight:700,color:inStock?'#2E7D32':'#C62828'}}>
                {inStock ? (p.quantity_available < 10 ? `Only ${p.quantity_available} left!` : 'In Stock') : 'Out of Stock'}
              </span>
            </div>

            <div style={{display:'flex',gap:12,alignItems:'center',marginTop:20}}>
              <div className="al-qty-ctrl">
                <button className="al-qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                <span style={{fontWeight:800,fontSize:'1rem',minWidth:24,textAlign:'center'}}>{qty}</span>
                <button className="al-qty-btn" onClick={()=>setQty(q=>q+1)}>+</button>
              </div>
              <button
                className="al-btn-primary"
                style={{flex:1,marginTop:0,padding:'13px'}}
                disabled={!inStock}
                onClick={()=>{ add({...p,quantity:qty}); toast.success(`${p.name} added to cart`); }}>
                <i className="fa-solid fa-bag-shopping" style={{marginRight:8}}/>Add to Cart
              </button>
            </div>

            <div style={{display:'flex',gap:12,marginTop:12}}>
              {[['fa-truck-fast','Free delivery over $50'],['fa-shield-halved','Secure checkout'],['fa-rotate-left','Easy returns']].map(([icon,label])=>(
                <div key={icon} style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.75rem',fontWeight:600,color:'var(--text-muted)'}}>
                  <i className={`fa-solid ${icon}`} style={{color:'var(--brand)',fontSize:'0.8rem'}}/>{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
