import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import PageLayout from '../components/common/PageLayout';

const FREE_DELIVERY_THRESHOLD = 50;

export default function Cart() {
  const { items, remove, updateQty, total, clear } = useCart();
  const [promo, setPromo]   = useState('');
  const [discount, setDiscount] = useState(0);
  const navigate            = useNavigate();

  const delivery  = total >= FREE_DELIVERY_THRESHOLD ? 0 : 4.99;
  const grandTotal = total - discount + delivery;

  const applyPromo = () => {
    if (promo.toUpperCase() === 'AFROLINK25') {
      setDiscount(total * 0.25);
      toast.success('25% discount applied!');
    } else {
      toast.error('Invalid promo code');
    }
  };

  if (items.length === 0) return (
    <PageLayout>
      <div className="al-page" style={{maxWidth:600,margin:'0 auto',paddingTop:80}}>
        <div className="al-empty">
          <i className="fa-solid fa-cart-shopping"/>
          <p>Your cart is empty</p>
          <Link to="/shop" className="al-btn-sm primary" style={{textDecoration:'none'}}>
            <i className="fa-solid fa-shop"/> Start Shopping
          </Link>
        </div>
      </div>
    </PageLayout>
  );

  return (
    <PageLayout>
      <div className="al-page">
        <h1 className="al-page-title">
          <i className="fa-solid fa-cart-shopping" style={{marginRight:10,fontSize:'1.5rem'}}/>
          Your Cart <span style={{fontSize:'1rem',fontFamily:"'Nunito',sans-serif",fontWeight:700,color:'var(--text-muted)'}}>{items.length} item{items.length!==1?'s':''}</span>
        </h1>

        <div className="al-cart-layout">
          {/* Items */}
          <div className="al-card">
            {items.map(item => {
              const price = item.sale_price ?? item.base_price;
              return (
                <div key={item.id} className="al-cart-item">
                  <div className="al-cart-img">
                    {item.image_url ? <img src={item.image_url} alt={item.name}/> : <i className="fa-solid fa-box-open" style={{fontSize:'1.5rem',opacity:0.3}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:'0.95rem',color:'var(--text-primary)',marginBottom:4}}>{item.name}</div>
                    <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--text-muted)',marginBottom:12}}>{item.vendor_name}</div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div className="al-qty-ctrl">
                        <button className="al-qty-btn" onClick={()=>item.quantity<=1?remove(item.id):updateQty(item.id,item.quantity-1)}>−</button>
                        <span style={{fontWeight:800,minWidth:24,textAlign:'center'}}>{item.quantity}</span>
                        <button className="al-qty-btn" onClick={()=>updateQty(item.id,item.quantity+1)}>+</button>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:16}}>
                        <span style={{fontWeight:800,fontSize:'1rem',color:'var(--brand)'}}>${(price*item.quantity).toFixed(2)}</span>
                        <button onClick={()=>remove(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'0.85rem',padding:4}}>
                          <i className="fa-regular fa-trash-can"/>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{paddingTop:16,display:'flex',justifyContent:'flex-end'}}>
              <button className="al-btn-sm danger" onClick={()=>{clear();toast.info('Cart cleared');}}>
                <i className="fa-solid fa-trash"/> Clear Cart
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="al-order-summary">
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.2rem',marginBottom:20}}>Order Summary</h3>
            <div className="al-summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            {discount > 0 && <div className="al-summary-row" style={{color:'#2E7D32'}}><span><i className="fa-solid fa-tag"/> Promo (25%)</span><span>−${discount.toFixed(2)}</span></div>}
            <div className="al-summary-row">
              <span><i className="fa-solid fa-truck-fast" style={{marginRight:6}}/>Delivery</span>
              <span style={{color:delivery===0?'#2E7D32':'inherit'}}>{delivery===0?'Free':`$${delivery.toFixed(2)}`}</span>
            </div>
            {total < FREE_DELIVERY_THRESHOLD && (
              <div style={{background:'var(--brand-light)',borderRadius:8,padding:'8px 12px',fontSize:'0.78rem',fontWeight:600,color:'var(--brand)',marginBottom:12}}>
                <i className="fa-solid fa-info-circle" style={{marginRight:6}}/>Add ${(FREE_DELIVERY_THRESHOLD-total).toFixed(2)} more for free delivery
              </div>
            )}
            <div className="al-summary-row total"><span>Total</span><span style={{color:'var(--brand)'}}>${grandTotal.toFixed(2)}</span></div>

            <div className="al-promo-row">
              <input className="al-promo-input" placeholder="Promo code (try AFROLINK25)" value={promo} onChange={e=>setPromo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applyPromo()}/>
              <button className="al-btn-sm outline" onClick={applyPromo}>Apply</button>
            </div>

            <button className="al-btn-primary" onClick={()=>navigate('/checkout')}>
              <i className="fa-solid fa-lock" style={{marginRight:8}}/>Proceed to Checkout
            </button>

            <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:14}}>
              {[['fa-shield-halved','Secure'],['fa-circle-check','Verified'],['fa-rotate-left','Returns OK']].map(([icon,label])=>(
                <span key={icon} style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>
                  <i className={`fa-solid ${icon}`} style={{fontSize:'0.8rem'}}/>{label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
