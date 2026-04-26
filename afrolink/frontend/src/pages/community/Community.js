import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import PageLayout from '../../components/common/PageLayout';

export default function Community() {
  const [tab, setTab]         = useState('posts');
  const [posts, setPosts]     = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const { user }              = useAuth();

  useEffect(()=>{
    setLoading(true);
    if (tab==='posts') {
      api.get('/community/posts?limit=20').then(r=>setPosts(r.data?.data??[])).finally(()=>setLoading(false));
    } else {
      api.get('/community/recipes?limit=20').then(r=>setRecipes(r.data?.data??[])).finally(()=>setLoading(false));
    }
  },[tab]);

  const submitPost = async e => {
    e.preventDefault();
    if (!newPost.trim()) return;
    try {
      const { data } = await api.post('/community/posts',{ body: newPost, postType:'status' });
      setPosts(ps=>[data,...ps]);
      setNewPost('');
      toast.success('Post shared!');
    } catch { toast.error('Failed to post'); }
  };

  return (
    <PageLayout>
      <div style={{background:'var(--brand-light)',borderBottom:'1.5px solid var(--border-warm)',padding:'48px 40px 0'}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'2.2rem',fontWeight:700,color:'var(--brand-dark)',marginBottom:6}}>Community Hub</h1>
          <p style={{color:'var(--text-muted)',fontWeight:500,marginBottom:24}}>Connect with the African diaspora community. Share recipes, stories and food tips.</p>
          <div style={{display:'flex',gap:4,borderBottom:'none'}}>
            {[['posts','fa-newspaper','Posts'],['recipes','fa-bowl-food','Recipes']].map(([key,icon,label])=>(
              <button key={key} onClick={()=>setTab(key)}
                style={{padding:'10px 20px',border:'none',background:tab===key?'white':'transparent',
                  borderRadius:'10px 10px 0 0',fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:'0.88rem',
                  color:tab===key?'var(--brand)':'var(--text-muted)',cursor:'pointer',
                  borderTop:tab===key?'1.5px solid var(--border-warm)':'none',
                  borderLeft:tab===key?'1.5px solid var(--border-warm)':'none',
                  borderRight:tab===key?'1.5px solid var(--border-warm)':'none',
                  display:'flex',alignItems:'center',gap:7}}>
                <i className={`fa-solid ${icon}`}/>{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'32px 40px'}}>
        {tab==='posts' && (
          <>
            {user && (
              <form onSubmit={submitPost} style={{marginBottom:24}}>
                <div className="al-card" style={{padding:16}}>
                  <textarea
                    value={newPost} onChange={e=>setNewPost(e.target.value)}
                    placeholder="Share something with the community…"
                    style={{width:'100%',border:'none',outline:'none',fontFamily:"'Nunito',sans-serif",fontSize:'0.92rem',resize:'none',minHeight:80,color:'var(--text-primary)'}}
                  />
                  <div style={{display:'flex',justifyContent:'flex-end',borderTop:'1px solid var(--border-warm)',paddingTop:10,marginTop:8}}>
                    <button type="submit" className="al-btn-sm primary" disabled={!newPost.trim()}>
                      <i className="fa-solid fa-paper-plane"/>Share
                    </button>
                  </div>
                </div>
              </form>
            )}

            {loading ? <div style={{textAlign:'center',padding:40}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'1.5rem',color:'var(--text-muted)'}}/></div>
            : posts.length===0 ? <div className="al-empty"><i className="fa-solid fa-newspaper"/><p>No posts yet. Be the first to share!</p></div>
            : posts.map(p=>(
              <div key={p.id} className="al-card" style={{marginBottom:16}}>
                <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center'}}>
                  <div style={{width:40,height:40,borderRadius:50,background:'var(--brand-light)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {p.author_avatar ? <img src={p.author_avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : <i className="fa-solid fa-circle-user" style={{fontSize:'1.4rem',color:'var(--brand)'}}/>}
                  </div>
                  <div>
                    <div style={{fontWeight:800,fontSize:'0.88rem'}}>{p.author_name||'Member'}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{new Date(p.created_at).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}</div>
                  </div>
                </div>
                {p.title && <div style={{fontWeight:700,marginBottom:6}}>{p.title}</div>}
                <p style={{color:'var(--text-muted)',fontWeight:500,fontSize:'0.9rem',lineHeight:1.65,margin:0}}>{p.body}</p>
                <div style={{display:'flex',gap:16,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border-warm)'}}>
                  {[['fa-heart',p.like_count||0],['fa-comment',p.comment_count||0]].map(([icon,count])=>(
                    <span key={icon} style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.78rem',fontWeight:700,color:'var(--text-muted)',cursor:'pointer'}}>
                      <i className={`fa-regular ${icon}`}/>{count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {tab==='recipes' && (
          <>
            {loading ? <div style={{textAlign:'center',padding:40}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'1.5rem',color:'var(--text-muted)'}}/></div>
            : recipes.length===0 ? <div className="al-empty"><i className="fa-solid fa-bowl-food"/><p>No recipes yet</p></div>
            : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                {recipes.map(r=>(
                  <Link key={r.id} to={`/community/recipes/${r.id}`} style={{textDecoration:'none'}}>
                    <div className="al-card" style={{padding:0,overflow:'hidden',transition:'transform 0.18s,box-shadow 0.18s'}}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
                      <div style={{height:160,background:'var(--brand-light)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                        {r.cover_image_url ? <img src={r.cover_image_url} alt={r.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <i className="fa-solid fa-bowl-food" style={{fontSize:'2.5rem',opacity:0.2}}/>}
                        {r.difficulty && <span className="al-product-badge">{r.difficulty}</span>}
                      </div>
                      <div style={{padding:'14px 16px'}}>
                        <div style={{fontWeight:800,fontSize:'0.92rem',marginBottom:6,color:'var(--text-primary)'}}>{r.title}</div>
                        <div style={{display:'flex',gap:12,fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:600}}>
                          {r.prep_time_min && <span><i className="fa-regular fa-clock" style={{marginRight:4}}/>{r.prep_time_min + (r.cook_time_min||0)} min</span>}
                          {r.servings && <span><i className="fa-solid fa-users" style={{marginRight:4}}/>{r.servings} servings</span>}
                          {r.cuisine_type && <span><i className="fa-solid fa-earth-africa" style={{marginRight:4}}/>{r.cuisine_type}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
