import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import PageLayout from '../../components/common/PageLayout';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);

  useEffect(()=>{
    Promise.all([
      api.get('/admin/stats'),
      api.get(`/admin/users?page=${page}&limit=15`),
    ]).then(([s,u])=>{ setStats(s.data); setUsers(u.data?.data??[]); }).finally(()=>setLoading(false));
  },[page]);

  const toggleUser = async (id, isActive) => {
    try {
      await api.patch(`/admin/users/${id}/status`,{isActive:!isActive});
      setUsers(us=>us.map(u=>u.id===id?{...u,is_active:!u.is_active}:u));
      toast.success(`User ${isActive?'suspended':'activated'}`);
    } catch { toast.error('Failed to update user'); }
  };

  const ROLE_BADGE={customer:'blue',vendor:'yellow',driver:'green',moderator:'grey',admin:'red',super_admin:'red'};

  return (
    <PageLayout>
      <div className="al-page">
        <h1 className="al-page-title">Admin Dashboard</h1>
        <p className="al-page-sub">Platform overview and user management</p>

        {stats && (
          <div className="al-stat-grid">
            {[
              {icon:'fa-users',       label:'Total Users',   value:stats.totalUsers?.toLocaleString(),    color:'#E3F2FD',icolor:'#1565C0'},
              {icon:'fa-bag-shopping',label:'Total Orders',  value:stats.totalOrders?.toLocaleString(),   color:'#FFF8E1',icolor:'#F57F17'},
              {icon:'fa-store',       label:'Active Vendors',value:stats.activeVendors?.toLocaleString(), color:'#E8F5E9',icolor:'#2E7D32'},
              {icon:'fa-dollar-sign', label:'Revenue',       value:`$${parseFloat(stats.totalRevenue||0).toLocaleString()}`,color:'#FFF3E0',icolor:'#E65100'},
            ].map(s=>(
              <div key={s.label} className="al-stat-card">
                <div className="al-stat-icon" style={{background:s.color}}><i className={`fa-solid ${s.icon}`} style={{color:s.icolor}}/></div>
                <div className="al-stat-label">{s.label}</div>
                <div className="al-stat-value">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="al-card">
          <div className="al-card-title"><i className="fa-solid fa-users"/>User Management</div>
          {loading ? <div style={{textAlign:'center',padding:32}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'1.5rem',color:'var(--text-muted)'}}/></div> : (
            <>
              <div className="al-table-wrap">
                <table className="al-table">
                  <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u.id}>
                        <td>
                          <div style={{fontWeight:700,fontSize:'0.88rem'}}>{u.display_name||u.email}</div>
                          <div style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{u.email}</div>
                        </td>
                        <td><span className={`al-badge ${ROLE_BADGE[u.role]||'grey'}`}>{u.role}</span></td>
                        <td style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>{new Date(u.created_at).toLocaleDateString('en-CA')}</td>
                        <td><span className={`al-badge ${u.is_active?'green':'red'}`}>{u.is_active?'Active':'Suspended'}</span></td>
                        <td>
                          <button className={`al-btn-sm ${u.is_active?'danger':'primary'}`} style={{padding:'5px 10px',fontSize:'0.75rem'}}
                            onClick={()=>toggleUser(u.id,u.is_active)}>
                            {u.is_active?<><i className="fa-solid fa-user-slash"/>Suspend</>:<><i className="fa-solid fa-user-check"/>Activate</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
                <button className="al-btn-sm outline" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}><i className="fa-solid fa-chevron-left"/></button>
                <span style={{padding:'8px 12px',fontSize:'0.82rem',fontWeight:700}}>Page {page}</span>
                <button className="al-btn-sm outline" onClick={()=>setPage(p=>p+1)} disabled={users.length<15}><i className="fa-solid fa-chevron-right"/></button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
