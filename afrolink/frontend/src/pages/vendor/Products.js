import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageLayout from '../../components/common/PageLayout';
import { toast } from 'react-toastify';

export default function VendorProducts() {
  const { user } = useAuth();
  const [products,setProducts] = useState([]);
  const [loading,setLoading]   = useState(true);

  useEffect(()=>{
    api.get(`/products?vendorId=${user?.id}&limit=100`).then(r=>setProducts(r.data?.data??[])).finally(()=>setLoading(false));
  },[user]);

  const toggleActive = async (p) => {
    try {
      await api.patch(`/products/${p.id}`,{isActive:!p.is_active});
      setProducts(ps=>ps.map(x=>x.id===p.id?{...x,is_active:!x.is_active}:x));
      toast.success(`Product ${p.is_active?'deactivated':'activated'}`);
    } catch { toast.error('Failed to update product'); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(ps=>ps.filter(p=>p.id!==id));
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete product'); }
  };

  return (
    <PageLayout>
      <div className="al-page">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
          <div>
            <h1 className="al-page-title">My Products</h1>
            <p className="al-page-sub" style={{margin:0}}>{products.length} product{products.length!==1?'s':''} listed</p>
          </div>
        </div>

        {loading ? <div style={{textAlign:'center',padding:48}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'1.5rem',color:'var(--text-muted)'}}/></div>
        : products.length===0 ? <div className="al-empty"><i className="fa-solid fa-box-open"/><p>No products yet. Add your first product to start selling.</p></div>
        : (
          <div className="al-table-wrap">
            <table className="al-table">
              <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p=>(
                  <tr key={p.id}>
                    <td>
                      <div style={{display:'flex',gap:10,alignItems:'center'}}>
                        <div style={{width:40,height:40,borderRadius:8,background:'var(--brand-light)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {p.image_url?<img src={p.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<i className="fa-solid fa-image" style={{opacity:0.3}}/>}
                        </div>
                        <div>
                          <div style={{fontWeight:700,fontSize:'0.88rem'}}>{p.name}</div>
                          <div style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{fontWeight:800,color:'var(--brand)'}}>
                      ${parseFloat(p.sale_price??p.base_price).toFixed(2)}
                      {p.sale_price && <span style={{marginLeft:4,fontWeight:600,color:'var(--text-muted)',textDecoration:'line-through',fontSize:'0.8rem'}}>${parseFloat(p.base_price).toFixed(2)}</span>}
                    </td>
                    <td><span className={`al-badge ${(p.quantity_available??0)>5?'green':(p.quantity_available??0)>0?'yellow':'red'}`}>{p.quantity_available??0} left</span></td>
                    <td><span className={`al-badge ${p.is_active?'green':'grey'}`}>{p.is_active?'Active':'Inactive'}</span></td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="al-btn-sm outline" style={{padding:'5px 8px',fontSize:'0.75rem'}} onClick={()=>toggleActive(p)}>
                          <i className={`fa-solid fa-${p.is_active?'eye-slash':'eye'}`}/>
                        </button>
                        <button className="al-btn-sm danger" style={{padding:'5px 8px',fontSize:'0.75rem'}} onClick={()=>deleteProduct(p.id)}>
                          <i className="fa-regular fa-trash-can"/>
                        </button>
                      </div>
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
