'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'

export default function AdminBannersPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editBanner, setEditBanner] = useState<any>(null)
  const [form, setForm] = useState({title:'',subtitle:'',imageUrl:'',link:'',order:0})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)
  const F = "'Segoe UI',system-ui,sans-serif"

  const token = () => localStorage.getItem('access_token')||''
  const hdrs = () => ({'Content-Type':'application/json',Authorization:'Bearer '+token()})

  useEffect(()=>{
    if(!token()){router.push('/login');return}
    load()
  },[])

  const load = ()=>{
    fetch(API+'/banners',{headers:hdrs()}).then(r=>r.json())
      .then(d=>{setBanners(Array.isArray(d)?d:[]);setLoading(false)})
      .catch(()=>setLoading(false))
  }

  const uploadFile = async(file: File, cb: (url:string)=>void)=>{
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(API+'/upload/file',{method:'POST',headers:{Authorization:'Bearer '+token()},body:fd})
      const data = await res.json()
      cb(data.url || data.path || data.filename || '')
    } catch(e){ alert('Upload амжилтгүй') }
    setUploading(false)
  }

  const addBanner = async()=>{
    setSaving(true)
    await fetch(API+'/banners',{method:'POST',headers:hdrs(),body:JSON.stringify({...form,isActive:true})})
    setForm({title:'',subtitle:'',imageUrl:'',link:'',order:0})
    setShowAdd(false);setSaving(false);load()
  }

  const updateBanner = async()=>{
    if(!editBanner) return
    setSaving(true)
    await fetch(API+'/banners/'+editBanner.id,{method:'PATCH',headers:hdrs(),body:JSON.stringify(editBanner)})
    setEditBanner(null);setSaving(false);load()
  }

  const toggleBanner = async(id:number,val:boolean)=>{
    await fetch(API+'/banners/'+id,{method:'PATCH',headers:hdrs(),body:JSON.stringify({isActive:val})})
    setBanners(p=>p.map(b=>b.id===id?{...b,isActive:val}:b))
  }

  const delBanner = async(id:number)=>{
    if(!confirm('Устгах уу?'))return
    await fetch(API+'/banners/'+id,{method:'DELETE',headers:hdrs()})
    setBanners(p=>p.filter(b=>b.id!==id))
  }

  const inp:React.CSSProperties={width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--text)',outline:'none',fontFamily:F,boxSizing:'border-box'}

  const ImageUploadField = ({value, onChange}:{value:string,onChange:(v:string)=>void}) => (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <input type="text" value={value} placeholder="https://... эсвэл файл upload хийнэ үү"
          onChange={e=>onChange(e.target.value)} style={{...inp,flex:1}}/>
        <button onClick={()=>fileRef.current?.click()}
          style={{padding:'9px 14px',background:'var(--orange-10)',border:'1px solid var(--orange-25)',color:'var(--orange)',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:F,whiteSpace:'nowrap',flexShrink:0}}>
          {uploading?'Uploading...':'📁 Файл сонгох'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
        onChange={e=>{const f=e.target.files?.[0];if(f) uploadFile(f,onChange)}}/>
      {value&&(
        <div style={{marginTop:8,borderRadius:8,overflow:'hidden',border:'1px solid var(--border)',height:120,position:'relative'}}>
          <img src={value} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}
            onError={e=>(e.currentTarget.style.display='none')}/>
          <div style={{position:'absolute',top:6,right:6}}>
            <button onClick={()=>onChange('')} style={{background:'rgba(0,0,0,0.6)',border:'none',color:'#fff',borderRadius:5,padding:'3px 8px',fontSize:11,cursor:'pointer'}}>✕</button>
          </div>
        </div>
      )}
    </div>
  )

  return(
    <div style={{padding:'28px 32px',fontFamily:F,color:'var(--text)'}}>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,paddingBottom:20,borderBottom:'1px solid var(--border)'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:600,margin:0,letterSpacing:'-0.4px'}}>Баннерууд</h1>
          <p style={{fontSize:13,color:'var(--text3)',margin:'5px 0 0'}}>Нийт {banners.length} · Идэвхтэй: {banners.filter(b=>b.isActive).length}</p>
        </div>
        <button onClick={()=>{setShowAdd(!showAdd);setEditBanner(null)}}
          style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:F}}>
          + Баннер нэмэх
        </button>
      </div>

      {/* ADD FORM */}
      {showAdd&&(
        <div style={{background:'var(--surface)',border:'1px solid var(--orange-20)',borderRadius:12,padding:24,marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            🖼️ Шинэ баннер нэмэх
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Гарчиг *</label>
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Баннерын гарчиг" style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Дэд гарчиг</label>
              <input value={form.subtitle} onChange={e=>setForm(p=>({...p,subtitle:e.target.value}))} placeholder="Дэд гарчиг" style={inp}/>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Зургийн URL *</label>
            <ImageUploadField value={form.imageUrl} onChange={v=>setForm(p=>({...p,imageUrl:v}))}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:12,marginBottom:16}}>
            <div>
              <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Холбоос URL</label>
              <input value={form.link} onChange={e=>setForm(p=>({...p,link:e.target.value}))} placeholder="/products" style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Эрэмбэ</label>
              <input type="number" value={form.order} onChange={e=>setForm(p=>({...p,order:+e.target.value}))} style={inp}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={addBanner} disabled={saving||!form.title}
              style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:F,opacity:(saving||!form.title)?0.6:1}}>
              {saving?'Хадгалж байна...':'Нэмэх'}
            </button>
            <button onClick={()=>setShowAdd(false)} style={{background:'transparent',border:'1px solid var(--border)',color:'var(--text3)',borderRadius:8,padding:'9px 16px',fontSize:13,cursor:'pointer',fontFamily:F}}>Болих</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editBanner&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:28,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontSize:15,fontWeight:600,marginBottom:20}}>✏️ Баннер засах</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Гарчиг</label>
                <input value={editBanner.title||''} onChange={e=>setEditBanner((p:any)=>({...p,title:e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Дэд гарчиг</label>
                <input value={editBanner.subtitle||''} onChange={e=>setEditBanner((p:any)=>({...p,subtitle:e.target.value}))} style={inp}/>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Зургийн URL</label>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <input value={editBanner.imageUrl||''} onChange={e=>setEditBanner((p:any)=>({...p,imageUrl:e.target.value}))} placeholder="https://..." style={{...inp,flex:1}}/>
                <button onClick={()=>editFileRef.current?.click()}
                  style={{padding:'9px 14px',background:'var(--orange-10)',border:'1px solid var(--orange-25)',color:'var(--orange)',borderRadius:8,cursor:'pointer',fontSize:12,fontFamily:F,whiteSpace:'nowrap',flexShrink:0}}>
                  {uploading?'Uploading...':'📁 Upload'}
                </button>
              </div>
              <input ref={editFileRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>{const f=e.target.files?.[0];if(f) uploadFile(f,(url)=>setEditBanner((p:any)=>({...p,imageUrl:url})))}}/>
              {editBanner.imageUrl&&(
                <div style={{borderRadius:8,overflow:'hidden',border:'1px solid var(--border)',height:140}}>
                  <img src={editBanner.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:12,marginBottom:16}}>
              <div>
                <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Холбоос URL</label>
                <input value={editBanner.link||''} onChange={e=>setEditBanner((p:any)=>({...p,link:e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Эрэмбэ</label>
                <input type="number" value={editBanner.order||0} onChange={e=>setEditBanner((p:any)=>({...p,order:+e.target.value}))} style={inp}/>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{fontSize:13,color:'var(--text3)'}}>Идэвхтэй:</span>
              <div onClick={()=>setEditBanner((p:any)=>({...p,isActive:!p.isActive}))}
                style={{width:38,height:22,borderRadius:11,background:editBanner.isActive?'var(--orange)':'var(--border2)',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                <div style={{position:'absolute',top:3,left:editBanner.isActive?17:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
              </div>
              <span style={{fontSize:12,color:editBanner.isActive?'#1D9E75':'var(--text4)'}}>{editBanner.isActive?'Идэвхтэй':'Идэвхгүй'}</span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={updateBanner} disabled={saving}
                style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:F}}>
                {saving?'Хадгалж байна...':'💾 Хадгалах'}
              </button>
              <button onClick={()=>setEditBanner(null)} style={{background:'transparent',border:'1px solid var(--border)',color:'var(--text3)',borderRadius:8,padding:'9px 16px',fontSize:13,cursor:'pointer',fontFamily:F}}>Болих</button>
            </div>
          </div>
        </div>
      )}

      {/* LIST */}
      {loading?<div style={{padding:48,textAlign:'center',color:'var(--text4)',fontSize:13}}>Уншиж байна...</div>
      :banners.length===0?<div style={{padding:48,textAlign:'center',color:'var(--text4)',fontSize:13,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12}}>Баннер байхгүй</div>
      :(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {banners.map((b,i)=>(
            <div key={b.id}
              style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,transition:'background .15s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
              onMouseLeave={e=>(e.currentTarget.style.background='var(--surface)')}>
              <div style={{fontSize:12,color:'var(--text4)',width:18,flexShrink:0}}>#{i+1}</div>
              {b.imageUrl?(
                <img src={b.imageUrl} alt={b.title} style={{width:96,height:56,objectFit:'cover',borderRadius:8,border:'1px solid var(--border)',flexShrink:0}}
                  onError={e=>{e.currentTarget.style.display='none'}}/>
              ):(
                <div style={{width:96,height:56,background:'var(--surface2)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--border)',flexShrink:0,fontSize:20}}>🖼️</div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:2}}>{b.title||'Гарчиггүй'}</div>
                <div style={{fontSize:12,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.subtitle||'—'}</div>
                {b.link&&<div style={{fontSize:11,color:'var(--orange)',marginTop:2}}>{b.link}</div>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <span style={{fontSize:12,color:b.isActive?'#1D9E75':'var(--text4)'}}>{b.isActive?'Идэвхтэй':'Идэвхгүй'}</span>
                  <div onClick={()=>toggleBanner(b.id,!b.isActive)}
                    style={{width:38,height:22,borderRadius:11,background:b.isActive?'var(--orange)':'var(--border2)',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                    <div style={{position:'absolute',top:3,left:b.isActive?17:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                  </div>
                </div>
                <button onClick={()=>{setEditBanner({...b});setShowAdd(false)}}
                  style={{background:'rgba(55,138,221,0.1)',border:'1px solid rgba(55,138,221,0.2)',color:'#378ADD',borderRadius:7,padding:'5px 12px',fontSize:12,cursor:'pointer',fontFamily:F}}>
                  ✏️ Засах
                </button>
                <button onClick={()=>delBanner(b.id)}
                  style={{background:'rgba(226,75,74,0.08)',border:'1px solid rgba(226,75,74,0.15)',color:'#e24b4a',borderRadius:7,padding:'5px 12px',fontSize:12,cursor:'pointer',fontFamily:F}}>
                  🗑️ Устгах
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}