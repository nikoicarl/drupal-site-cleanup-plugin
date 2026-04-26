import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import PageLayout from '../../components/common/PageLayout';

export default function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get(`/community/recipes/${id}`).then(r=>setRecipe(r.data)).finally(()=>setLoading(false));
  },[id]);

  if (loading) return <PageLayout><div style={{textAlign:'center',padding:80}}><i className="fa-solid fa-spinner fa-spin" style={{fontSize:'2rem',color:'var(--text-muted)'}}/></div></PageLayout>;
  if (!recipe) return <PageLayout><div className="al-page al-empty"><i className="fa-solid fa-bowl-food"/><p>Recipe not found</p><Link to="/community" className="al-btn-sm primary" style={{textDecoration:'none'}}>Community</Link></div></PageLayout>;

  const ingredients = recipe.ingredients || [];
  const instructions = recipe.instructions || [];

  return (
    <PageLayout>
      <div className="al-page" style={{maxWidth:800}}>
        <Link to="/community?tab=recipes" style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--text-muted)',textDecoration:'none',fontSize:'0.85rem',fontWeight:700,marginBottom:24}}>
          <i className="fa-solid fa-arrow-left"/> Recipes
        </Link>

        <div style={{height:360,borderRadius:20,background:'var(--brand-light)',overflow:'hidden',marginBottom:28,display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px solid var(--border-warm)'}}>
          {recipe.images?.[0]?.url ? <img src={recipe.images[0].url} alt={recipe.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : <i className="fa-solid fa-bowl-food" style={{fontSize:'4rem',opacity:0.2}}/>}
        </div>

        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'2.2rem',fontWeight:700,color:'var(--brand-dark)',margin:0,lineHeight:1.2}}>{recipe.title}</h1>
          {recipe.rating_avg > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0,marginLeft:20}}>
              <i className="fa-solid fa-star" style={{color:'#F59E0B'}}/>
              <span style={{fontWeight:800}}>{recipe.rating_avg}</span>
              <span style={{color:'var(--text-muted)',fontSize:'0.82rem'}}>({recipe.review_count||0})</span>
            </div>
          )}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'var(--brand-light)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="fa-solid fa-circle-user" style={{color:'var(--brand)'}}/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'0.88rem'}}>{recipe.author_name}</div>
            <div style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{new Date(recipe.created_at).toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'})}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:20,marginBottom:24,flexWrap:'wrap'}}>
          {[
            recipe.prep_time_min && ['fa-clock',`${recipe.prep_time_min} min prep`],
            recipe.cook_time_min && ['fa-fire',''+recipe.cook_time_min+' min cook'],
            recipe.servings      && ['fa-users',`${recipe.servings} servings`],
            recipe.difficulty    && ['fa-signal',recipe.difficulty],
            recipe.cuisine_type  && ['fa-earth-africa',recipe.cuisine_type],
          ].filter(Boolean).map(([icon,label])=>(
            <div key={icon} style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.82rem',fontWeight:700,color:'var(--text-muted)'}}>
              <i className={`fa-solid ${icon}`} style={{color:'var(--brand)',fontSize:'0.85rem'}}/>{label}
            </div>
          ))}
        </div>

        {recipe.description && <p style={{color:'var(--text-muted)',lineHeight:1.7,marginBottom:28,fontWeight:500}}>{recipe.description}</p>}

        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:28,alignItems:'start'}}>
          <div className="al-card">
            <div className="al-card-title"><i className="fa-solid fa-list-check"/>Ingredients</div>
            {ingredients.length===0 ? <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>See instructions for ingredients.</p>
            : (
              <ul style={{padding:0,margin:0,listStyle:'none'}}>
                {ingredients.map((ing,i)=>(
                  <li key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border-warm)',fontSize:'0.88rem'}}>
                    <i className="fa-solid fa-circle" style={{color:'var(--brand)',fontSize:'0.4rem',marginTop:7,flexShrink:0}}/>
                    <span style={{fontWeight:600}}>{ing.quantity} {ing.unit}</span>
                    <span style={{color:'var(--text-muted)'}}>{ing.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="al-card">
            <div className="al-card-title"><i className="fa-solid fa-list-ol"/>Instructions</div>
            {instructions.length===0 ? <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No step-by-step instructions provided.</p>
            : (
              <ol style={{padding:0,margin:0,listStyle:'none',counterReset:'step'}}>
                {instructions.map((step,i)=>(
                  <li key={i} style={{display:'flex',gap:14,marginBottom:20}}>
                    <div style={{width:28,height:28,borderRadius:8,background:'var(--brand)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.78rem',flexShrink:0}}>
                      {i+1}
                    </div>
                    <p style={{color:'var(--text-muted)',lineHeight:1.65,margin:0,fontWeight:500,fontSize:'0.9rem',paddingTop:3}}>{step.text||step.instruction||step}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {recipe.dietary_tags?.length > 0 && (
          <div style={{marginTop:24,display:'flex',gap:8,flexWrap:'wrap'}}>
            {recipe.dietary_tags.map(t=>(
              <span key={t} className="al-badge green"><i className="fa-solid fa-leaf"/>{t}</span>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
