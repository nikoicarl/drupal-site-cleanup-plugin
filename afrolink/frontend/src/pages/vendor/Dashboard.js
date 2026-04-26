import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/common/PageLayout';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/orders?limit=5').then(r=>setOrders(r.data?.data??[])).catch(()=>{});
    api.get(`/products?vendorId=${user?.id}&limit=5`).then(r=>setProducts(r.data?.data??[])).catch(()=>{});
  }, [user]);

  const revenue = orders.filter(o=>o.payment_status==='paid').reduce((s,o)=>s+parseFloat(o.total_amount),0);
  const STATUS_BADGE = {pending:'yellow',confirmed:'blue',preparing:'yellow',shipped:'blue',delivered:'green',cancelled:'red'};

  return (
    <PageLayout>
      <div className="al-page">
        <h1 className="al-page-title">Vendor Dashboard</h1>
        <p className="al-page-sub">Manage your store and track performance</p>

        <div className="al-stat-grid">
          {[
            {icon:'fa-dollar-sign',  label:'Revenue',    value:`$${revenue.toFixed(0)}`,  color:'#E8F5E9',icolor:'#2E7D32'},
            {icon:'fa-bag-shopping', label:'Orders',     value:orders.length,              color:'#E3F2FD',icolor:'#1565C0'},
            {icon:'fa-box-open',     label:'Products',   value:products.length,            color:'#FFF8E1',icolor:'#F57F17'},
            {icon:'fa-star',         label:'Avg Rating', value:'4.8',                      color:'#FFF3E0',icolor:'#E65100'},
          ].map(s=>(
            <div key={s.label} className="al-stat-card">
              <div className="al-stat-icon" style={{background:s.color}}><i className={`fa-solid ${s.icon}`} style={{color:s.icolor}}/></div>
              <div className="al-stat-label">{s.label}</div>
              <div className="al-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          <div className="al-card">
            <div className="al-card-title" style={{justifyContent:'space-between'}}>
              <span><i className="fa-solid fa-clock-rotate-left"/>Recent Orders</span>
              <Link to="/vendor/orders" className="al-btn-sm outline" style={{textDecoration:'none'}}>View all</Link>
            </div>
            {orders.length===0 ? <div className="al-empty" style={{padding:'24px 0'}}><i className="fa-solid fa-bag-shopping"/><p>No orders yet</p></div> : (
              <div className="al-table-wrap">
                <table className="al-table">
                  <thead><tr><th>Order</th><th>Status</th><th>Total</th></tr></thead>
                  <tbody>
                    {orders.map(o=>(
                      <tr key={o.id}>
                        <td style={{fontWeight:700}}>#{o.order_number}</td>
                        <td><span className={`al-badge ${STATUS_BADGE[o.status]||'grey'}`}>{o.status}</span></td>
                        <td style={{fontWeight:800,color:'var(--brand)'}}>${parseFloat(o.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="al-card">
            <div className="al-card-title" style={{justifyContent:'space-between'}}>
              <span><i className="fa-solid fa-box-open"/>My Products</span>
              <div style={{display:'flex',gap:8}}>
                <Link to="/vendor/products/new" className="al-btn-sm primary" style={{textDecoration:'none'}}>
                  <i className="fa-solid fa-plus"/>Add
                </Link>
                <Link to="/vendor/products" className="al-btn-sm outline" style={{textDecoration:'none'}}>View all</Link>
              </div>
            </div>
            {products.length===0 ? <div className="al-empty" style={{padding:'24px 0'}}><i className="fa-solid fa-box-open"/><p>No products yet</p></div> : (
              products.map(p=>(
                <div key={p.id} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border-warm)',alignItems:'center'}}>
                  <div style={{width:44,height:44,borderRadius:8,background:'var(--brand-light)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {p.image_url ? <img src={p.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <i className="fa-solid fa-image" style={{opacity:0.3}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:'0.85rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>${parseFloat(p.base_price).toFixed(2)}</div>
                  </div>
                  <span className={`al-badge ${p.is_active?'green':'grey'}`}>{p.is_active?'Active':'Inactive'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
