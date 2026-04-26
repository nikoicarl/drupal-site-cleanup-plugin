import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import PageLayout from '../../components/common/PageLayout';
import { toast } from 'react-toastify';

const STATUS_BADGE={pending:'yellow',confirmed:'blue',preparing:'yellow',shipped:'blue',delivered:'green',cancelled:'red'};
const NEXT_STATUS={confirmed:'preparing',preparing:'ready',ready:'shipped',shipped:'delivered'};

export default function VendorOrders() {
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    api.get('/orders?limit=50').then(r=>setOrders(r.data?.data??[])).finally(()=>setLoading(false));
  },[]);

  const advance = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`,{status});
      setOrders(os=>os.map(o=>o.id===id?{...o,status}:o));
      toast.success(`Order updated to ${status}`);
    } catch { toast.error('Failed to update order'); }
  };

  return (
    <PageLayout>
      <div className="al-page">
        <h1 className="al-page-title">Orders</h1>
        {loading ? <div style={{textAlign:'center',padding:48}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'1.5rem',color:'var(--text-muted)'}}/></div>
        : orders.length===0 ? <div className="al-empty"><i className="fa-solid fa-bag-shopping"/><p>No orders yet</p></div>
        : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Payment</th><th>Total</th><th>Action</th></tr></thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o.id}>
                    <td style={{fontWeight:800}}>#{o.order_number}</td>
                    <td>{new Date(o.placed_at).toLocaleDateString('en-CA')}</td>
                    <td><span className={`al-badge ${STATUS_BADGE[o.status]||'grey'}`}>{o.status}</span></td>
                    <td><span className={`al-badge ${o.payment_status==='paid'?'green':'yellow'}`}>{o.payment_status}</span></td>
                    <td style={{fontWeight:800,color:'var(--brand)'}}>${parseFloat(o.total_amount).toFixed(2)}</td>
                    <td>
                      {NEXT_STATUS[o.status] && (
                        <button className="al-btn-sm primary" style={{fontSize:'0.75rem',padding:'5px 10px'}}
                          onClick={()=>advance(o.id,NEXT_STATUS[o.status])}>
                          Mark {NEXT_STATUS[o.status]}
                        </button>
                      )}
                    </td>
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
