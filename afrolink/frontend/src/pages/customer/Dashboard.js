import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/common/PageLayout';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/orders?limit=5').then(r=>setOrders(r.data?.data??[])).catch(()=>{});
    api.get('/users/me').then(r=>setProfile(r.data)).catch(()=>{});
  }, []);

  const STATUS_BADGE = { pending:'yellow', confirmed:'blue', preparing:'yellow', shipped:'blue', delivered:'green', cancelled:'red' };

  return (
    <PageLayout>
      <div className="al-page">
        <div style={{marginBottom:32}}>
          <h1 className="al-page-title">My Account</h1>
          <p className="al-page-sub">Welcome back, {profile?.profile?.first_name || user?.email}!</p>
        </div>

        <div className="al-stat-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:32}}>
          {[
            {icon:'fa-bag-shopping',label:'Total Orders',value:orders.length,color:'#FFF8E1',icolor:'#F57F17'},
            {icon:'fa-truck-fast',  label:'In Transit',  value:orders.filter(o=>o.status==='shipped').length, color:'#E3F2FD',icolor:'#1565C0'},
            {icon:'fa-circle-check',label:'Delivered',   value:orders.filter(o=>o.status==='delivered').length,color:'#E8F5E9',icolor:'#2E7D32'},
          ].map(s=>(
            <div key={s.label} className="al-stat-card">
              <div className="al-stat-icon" style={{background:s.color}}><i className={`fa-solid ${s.icon}`} style={{color:s.icolor}}/></div>
              <div className="al-stat-label">{s.label}</div>
              <div className="al-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24}}>
          <div className="al-card">
            <div className="al-card-title" style={{justifyContent:'space-between'}}>
              <span><i className="fa-solid fa-clock-rotate-left"/>Recent Orders</span>
              <Link to="/account/orders" className="al-btn-sm outline" style={{textDecoration:'none',fontFamily:"'Nunito',sans-serif"}}>View all</Link>
            </div>
            {orders.length===0 ? (
              <div className="al-empty" style={{padding:'32px 0'}}>
                <i className="fa-solid fa-bag-shopping"/>
                <p style={{fontSize:'0.9rem'}}>No orders yet</p>
                <Link to="/shop" className="al-btn-sm primary" style={{textDecoration:'none'}}>Start Shopping</Link>
              </div>
            ) : (
              <div className="al-table-wrap">
                <table className="al-table">
                  <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
                  <tbody>
                    {orders.map(o=>(
                      <tr key={o.id}>
                        <td><Link to={`/orders/${o.id}`} style={{color:'var(--brand)',fontWeight:700,textDecoration:'none'}}>#{o.order_number}</Link></td>
                        <td>{new Date(o.placed_at).toLocaleDateString('en-CA')}</td>
                        <td><span className={`al-badge ${STATUS_BADGE[o.status]||'grey'}`}>{o.status}</span></td>
                        <td style={{fontWeight:800}}>${parseFloat(o.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="al-card">
            <div className="al-card-title"><i className="fa-solid fa-circle-user"/>Profile</div>
            {profile && (
              <div style={{fontSize:'0.88rem'}}>
                <div style={{marginBottom:10}}><span style={{fontWeight:700}}>Name:</span> <span style={{color:'var(--text-muted)'}}>{profile.profile?.first_name} {profile.profile?.last_name}</span></div>
                <div style={{marginBottom:10}}><span style={{fontWeight:700}}>Email:</span> <span style={{color:'var(--text-muted)'}}>{profile.email}</span></div>
                <div style={{marginBottom:10}}><span style={{fontWeight:700}}>City:</span> <span style={{color:'var(--text-muted)'}}>{profile.profile?.city||'—'}</span></div>
                <div style={{marginBottom:10}}>
                  <span style={{fontWeight:700}}>Email verified: </span>
                  <span className={`al-badge ${profile.is_email_verified?'green':'yellow'}`} style={{marginLeft:4}}>
                    {profile.is_email_verified?'Verified':'Pending'}
                  </span>
                </div>
              </div>
            )}
            <Link to="/account/edit" className="al-btn-sm outline" style={{textDecoration:'none',marginTop:12,display:'inline-flex'}}>
              <i className="fa-solid fa-pen"/>Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
