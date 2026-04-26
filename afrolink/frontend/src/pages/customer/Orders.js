import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageLayout from '../../components/common/PageLayout';

const STATUS_BADGE = { pending:'yellow',confirmed:'blue',preparing:'yellow',shipped:'blue',delivered:'green',cancelled:'red' };
const STATUSES = ['all','pending','confirmed','preparing','shipped','delivered','cancelled'];

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = filter==='all' ? '/orders?limit=50' : `/orders?status=${filter}&limit=50`;
    api.get(url).then(r=>setOrders(r.data?.data??[])).finally(()=>setLoading(false));
  }, [filter]);

  return (
    <PageLayout>
      <div className="al-page">
        <h1 className="al-page-title">My Orders</h1>
        <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
          {STATUSES.map(s=>(
            <button key={s} className={`al-btn-sm ${filter===s?'primary':'outline'}`} onClick={()=>setFilter(s)} style={{textTransform:'capitalize'}}>
              {s==='all'?'All Orders':s}
            </button>
          ))}
        </div>
        {loading ? <div style={{textAlign:'center',padding:48}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'1.5rem',color:'var(--text-muted)'}}/></div>
        : orders.length===0 ? (
          <div className="al-empty"><i className="fa-solid fa-bag-shopping"/><p>No orders found</p><Link to="/shop" className="al-btn-sm primary" style={{textDecoration:'none'}}>Shop Now</Link></div>
        ) : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Status</th><th>Payment</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o.id}>
                    <td style={{fontWeight:800}}>#{o.order_number}</td>
                    <td>{new Date(o.placed_at).toLocaleDateString('en-CA')}</td>
                    <td>{o.item_count} item{o.item_count!==1?'s':''}</td>
                    <td><span className={`al-badge ${STATUS_BADGE[o.status]||'grey'}`}>{o.status}</span></td>
                    <td><span className={`al-badge ${o.payment_status==='paid'?'green':'yellow'}`}>{o.payment_status}</span></td>
                    <td style={{fontWeight:800,color:'var(--brand)'}}>${parseFloat(o.total_amount).toFixed(2)}</td>
                    <td><Link to={`/orders/${o.id}`} className="al-btn-sm outline" style={{textDecoration:'none',padding:'5px 10px',fontSize:'0.75rem'}}><i className="fa-solid fa-eye"/>Track</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
