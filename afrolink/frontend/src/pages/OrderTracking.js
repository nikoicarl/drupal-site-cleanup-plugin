import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import PageLayout from '../components/common/PageLayout';

const STEPS = [
  { key:'pending',    icon:'fa-clock',         label:'Order Placed'  },
  { key:'confirmed',  icon:'fa-circle-check',  label:'Confirmed'     },
  { key:'preparing',  icon:'fa-fire-burner',   label:'Preparing'     },
  { key:'shipped',    icon:'fa-truck-fast',    label:'On the Way'    },
  { key:'delivered',  icon:'fa-house-chimney', label:'Delivered'     },
];

const STATUS_ORDER = ['pending','confirmed','preparing','ready','shipped','delivered'];

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r=>setOrder(r.data)).finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <PageLayout><div style={{textAlign:'center',padding:80}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',color:'var(--text-muted)'}}/></div></PageLayout>;
  if (!order) return <PageLayout><div className="al-page al-empty"><i className="fa-solid fa-receipt"/><p>Order not found</p><Link to="/account/orders" className="al-btn-sm primary" style={{textDecoration:'none'}}>My Orders</Link></div></PageLayout>;

  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <PageLayout>
      <div className="al-page" style={{maxWidth:760}}>
        <Link to="/account/orders" style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--text-muted)',textDecoration:'none',fontSize:'0.85rem',fontWeight:700,marginBottom:24}}>
          <i className="fa-solid fa-arrow-left"/> My Orders
        </Link>

        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28}}>
          <div>
            <h1 className="al-page-title" style={{marginBottom:4}}>Order #{order.order_number}</h1>
            <p style={{color:'var(--text-muted)',fontWeight:600,fontSize:'0.88rem',margin:0}}>Placed {new Date(order.placed_at).toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <span className={`al-badge ${order.payment_status==='paid'?'green':'yellow'}`}>
            <i className={`fa-solid fa-${order.payment_status==='paid'?'circle-check':'clock'}`}/>
            {order.payment_status==='paid'?'Paid':'Payment Pending'}
          </span>
        </div>

        {/* Progress */}
        <div className="al-card" style={{marginBottom:24}}>
          <div className="al-card-title"><i className="fa-solid fa-route"/>Delivery Status</div>
          <ul className="al-timeline">
            {STEPS.map((step,i) => {
              const done   = STATUS_ORDER.indexOf(step.key) < currentIdx;
              const active = STATUS_ORDER.indexOf(step.key) === currentIdx;
              return (
                <li key={step.key} className="al-timeline-item">
                  <div className={`al-timeline-dot ${done?'done':active?'active':''}`}>
                    <i className={`fa-solid ${step.icon}`}/>
                  </div>
                  <div style={{paddingTop:8}}>
                    <div style={{fontWeight:700,fontSize:'0.9rem',color:active?'var(--brand)':done?'var(--text-primary)':'var(--text-muted)'}}>{step.label}</div>
                    {active && <div style={{fontSize:'0.78rem',color:'var(--text-muted)',marginTop:2}}>Current status</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Items */}
        <div className="al-card">
          <div className="al-card-title"><i className="fa-solid fa-box-open"/>Items Ordered</div>
          {(order.items||[]).map(item=>(
            <div key={item.id} style={{display:'flex',gap:14,padding:'12px 0',borderBottom:'1px solid var(--border-warm)'}}>
              <div style={{width:56,height:56,borderRadius:10,background:'var(--brand-light)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {item.image_url ? <img src={item.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <i className="fa-solid fa-box-open" style={{opacity:0.3}}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,marginBottom:2}}>{item.product_name}</div>
                <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>Qty: {item.quantity}</div>
              </div>
              <div style={{fontWeight:800,color:'var(--brand)'}}>${parseFloat(item.total_price).toFixed(2)}</div>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'flex-end',paddingTop:14}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'0.82rem',color:'var(--text-muted)',fontWeight:600}}>Order Total</div>
              <div style={{fontSize:'1.4rem',fontFamily:"'Playfair Display',serif",fontWeight:700,color:'var(--brand)'}}>${parseFloat(order.total_amount).toFixed(2)} {order.currency}</div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
