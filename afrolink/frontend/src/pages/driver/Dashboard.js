import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import PageLayout from '../../components/common/PageLayout';
import { toast } from 'react-toastify';

const STATUS_BADGE={unassigned:'grey',assigned:'blue',picked_up:'yellow',in_transit:'yellow',delivered:'green',failed:'red'};
const NEXT={assigned:'picked_up',picked_up:'in_transit',in_transit:'delivered'};

export default function DriverDashboard() {
  const [available, setAvailable] = useState([]);
  const [mine, setMine]           = useState([]);
  const [tab, setTab]             = useState('available');
  const [loading, setLoading]     = useState(true);

  const load = () => {
    Promise.all([
      api.get('/deliveries/jobs'),
      api.get('/deliveries/my'),
    ]).then(([a,m])=>{ setAvailable(a.data??[]); setMine(m.data??[]); }).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const accept = async (id) => {
    try {
      await api.patch(`/deliveries/${id}/accept`);
      toast.success('Job accepted!');
      load();
    } catch (err) { toast.error(err.response?.data?.error||'Failed to accept job'); }
  };

  const advance = async (id, status) => {
    try {
      await api.patch(`/deliveries/${id}/status`,{status});
      toast.success(`Status updated to ${status}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const jobs = tab==='available' ? available : mine;

  return (
    <PageLayout>
      <div className="al-page">
        <h1 className="al-page-title">Driver Dashboard</h1>

        <div className="al-stat-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:28}}>
          {[
            {icon:'fa-truck-fast',  label:'Active Jobs',  value:mine.filter(j=>!['delivered','failed'].includes(j.status)).length, color:'#E3F2FD',icolor:'#1565C0'},
            {icon:'fa-circle-check',label:'Delivered',    value:mine.filter(j=>j.status==='delivered').length, color:'#E8F5E9',icolor:'#2E7D32'},
            {icon:'fa-dollar-sign', label:'Est. Earnings',value:`$${mine.filter(j=>j.status==='delivered').reduce((s,j)=>s+parseFloat(j.delivery_fee||0),0).toFixed(2)}`, color:'#FFF8E1',icolor:'#F57F17'},
          ].map(s=>(
            <div key={s.label} className="al-stat-card">
              <div className="al-stat-icon" style={{background:s.color}}><i className={`fa-solid ${s.icon}`} style={{color:s.icolor}}/></div>
              <div className="al-stat-label">{s.label}</div>
              <div className="al-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {[['available','fa-list','Available Jobs'],['mine','fa-truck-fast','My Deliveries']].map(([key,icon,label])=>(
            <button key={key} className={`al-btn-sm ${tab===key?'primary':'outline'}`} onClick={()=>setTab(key)}>
              <i className={`fa-solid ${icon}`}/>{label} {tab===key?`(${jobs.length})`:''}
            </button>
          ))}
        </div>

        {loading ? <div style={{textAlign:'center',padding:48}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'1.5rem',color:'var(--text-muted)'}}/></div>
        : jobs.length===0 ? <div className="al-empty"><i className="fa-solid fa-truck-fast"/><p>{tab==='available'?'No jobs available right now':'No deliveries yet'}</p></div>
        : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead><tr><th>Job ID</th><th>Pickup</th><th>Dropoff</th><th>Fee</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {jobs.map(j=>(
                  <tr key={j.id}>
                    <td style={{fontWeight:700,fontFamily:'monospace',fontSize:'0.8rem'}}>{j.id.slice(0,8)}…</td>
                    <td style={{fontSize:'0.82rem'}}>{j.pickup_address?.line1||j.pickup_address?.city||'—'}</td>
                    <td style={{fontSize:'0.82rem'}}>{j.dropoff_address?.line1||j.dropoff_address?.city||'—'}</td>
                    <td style={{fontWeight:800,color:'var(--brand)'}}>{j.delivery_fee?`$${parseFloat(j.delivery_fee).toFixed(2)}`:'—'}</td>
                    <td><span className={`al-badge ${STATUS_BADGE[j.status]||'grey'}`}>{j.status}</span></td>
                    <td>
                      {tab==='available' && j.status==='unassigned' && (
                        <button className="al-btn-sm primary" style={{fontSize:'0.75rem',padding:'5px 10px'}} onClick={()=>accept(j.id)}>
                          <i className="fa-solid fa-check"/>Accept
                        </button>
                      )}
                      {tab==='mine' && NEXT[j.status] && (
                        <button className="al-btn-sm primary" style={{fontSize:'0.75rem',padding:'5px 10px'}} onClick={()=>advance(j.id,NEXT[j.status])}>
                          Mark {NEXT[j.status].replace('_',' ')}
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
