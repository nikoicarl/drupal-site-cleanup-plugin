import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import PageLayout from '../components/common/PageLayout';

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addr, setAddr] = useState({ line1:'', line2:'', city:'', province:'ON', postalCode:'', country:'Canada' });

  const delivery = total >= 50 ? 0 : 4.99;
  const grandTotal = total + delivery;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!items.length) { toast.error('Your cart is empty'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
        shippingAddress: addr,
      });
      clear();
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const setA = (k,v) => setAddr(a=>({...a,[k]:v}));

  return (
    <PageLayout>
      <div className="al-page">
        <h1 className="al-page-title"><i className="fa-solid fa-lock" style={{marginRight:10,fontSize:'1.4rem'}}/>Checkout</h1>
        <p className="al-page-sub">Complete your order</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:28,alignItems:'start'}}>
          <form onSubmit={handleSubmit}>
            <div className="al-card" style={{marginBottom:20}}>
              <div className="al-card-title"><i className="fa-solid fa-location-dot"/>Shipping Address</div>
              <div className="al-form-group">
                <label className="al-form-label">Street Address</label>
                <input className="al-form-input" required value={addr.line1} onChange={e=>setA('line1',e.target.value)} placeholder="123 Main St"/>
              </div>
              <div className="al-form-group">
                <label className="al-form-label">Apt / Unit (optional)</label>
                <input className="al-form-input" value={addr.line2} onChange={e=>setA('line2',e.target.value)} placeholder="Apt 4B"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="al-form-group">
                  <label className="al-form-label">City</label>
                  <input className="al-form-input" required value={addr.city} onChange={e=>setA('city',e.target.value)} placeholder="Ottawa"/>
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Postal Code</label>
                  <input className="al-form-input" required value={addr.postalCode} onChange={e=>setA('postalCode',e.target.value)} placeholder="K1A 0A6"/>
                </div>
              </div>
            </div>

            <div className="al-card" style={{marginBottom:20}}>
              <div className="al-card-title"><i className="fa-solid fa-credit-card"/>Payment</div>
              <div style={{background:'var(--brand-light)',borderRadius:10,padding:'14px 16px',fontSize:'0.85rem',fontWeight:600,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:10}}>
                <i className="fa-solid fa-info-circle" style={{color:'var(--brand)'}}/>
                Payment via Stripe will be integrated. Your order will be confirmed on placement.
              </div>
            </div>

            <button type="submit" className="al-btn-primary" disabled={loading||!items.length}>
              {loading ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:8}}/>Placing Order…</> : <>Place Order — ${grandTotal.toFixed(2)}</>}
            </button>
          </form>

          {/* Summary */}
          <div className="al-order-summary">
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.1rem',marginBottom:16}}>Order ({items.length} items)</h3>
            {items.map(item=>(
              <div key={item.id} style={{display:'flex',gap:10,marginBottom:12,alignItems:'center'}}>
                <div style={{width:44,height:44,borderRadius:8,background:'var(--brand-light)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {item.image_url ? <img src={item.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <i className="fa-solid fa-box-open" style={{fontSize:'1rem',opacity:0.3}}/>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:'0.82rem'}}>{item.name}</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>×{item.quantity}</div>
                </div>
                <div style={{fontWeight:800,fontSize:'0.9rem',color:'var(--brand)'}}>${((item.sale_price??item.base_price)*item.quantity).toFixed(2)}</div>
              </div>
            ))}
            <div style={{borderTop:'1.5px solid var(--border-warm)',paddingTop:12,marginTop:4}}>
              <div className="al-summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
              <div className="al-summary-row"><span>Delivery</span><span style={{color:delivery===0?'#2E7D32':'inherit'}}>{delivery===0?'Free':`$${delivery.toFixed(2)}`}</span></div>
              <div className="al-summary-row total"><span>Total</span><span style={{color:'var(--brand)'}}>${grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
