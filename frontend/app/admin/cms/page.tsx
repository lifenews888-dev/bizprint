'use client'
import './cms.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

const GROUPS = [
  { id:'general', label:'Ерөнхий', fields:[
    { key:'site_name',        label:'Сайтын нэр',    ph:'BizPrint' },
    { key:'site_description', label:'Тайлбар',        ph:'Хэвлэлийн платформ' },
    { key:'contact_email',    label:'И-мэйл',         ph:'info@bizprint.mn' },
    { key:'contact_phone',    label:'Утас',           ph:'+976 9999-9999' },
  ]},
  { id:'colors', label:'Өнгө & Загвар', fields:[
    { key:'primary_color', label:'Үндсэн өнгө',  ph:'var(--orange)', type:'color' },
    { key:'bg_color',      label:'Дэвсгэр',       ph:'#0A0A0A', type:'color' },
    { key:'surface_color', label:'Surface',        ph:'#0F0F0F', type:'color' },
    { key:'text_color',    label:'Үсгийн өнгө',  ph:'#F1F5F9', type:'color' },
    { key:'muted_color',   label:'Бүдэг үсэг',    ph:'#555555', type:'color' },
  ]},
  { id:'hero', label:'Hero хэсэг', fields:[
    { key:'hero_badge',     label:'Badge текст',   ph:'Монголын №1 хэвлэлийн платформ' },
    { key:'hero_title',     label:'Гарчиг 1',      ph:'Хэвлэлийн захиалга' },
    { key:'hero_title2',    label:'Гарчиг 2',      ph:'хялбар, хурдан,' },
    { key:'hero_subtitle',  label:'Дэд текст',     ph:'AI үнэ тооцоолол...' },
    { key:'hero_btn1_text', label:'1-р товч',       ph:'Захиалга өгөх →' },
    { key:'hero_btn1_link', label:'1-р товч линк',  ph:'/products' },
    { key:'hero_btn2_text', label:'2-р товч',       ph:'Үнэ тооцоолох' },
  ]},
  { id:'stats', label:'Статистик', fields:[
    { key:'stat_1_num',   label:'Тоо 1',    ph:'30+' },
    { key:'stat_1_label', label:'Нэр 1',    ph:'Бүтээгдэхүүн' },
    { key:'stat_2_num',   label:'Тоо 2',    ph:'50+' },
    { key:'stat_2_label', label:'Нэр 2',    ph:'Хэвлэлийн газар' },
    { key:'stat_3_num',   label:'Тоо 3',    ph:'1,000+' },
    { key:'stat_3_label', label:'Нэр 3',    ph:'Захиалга' },
    { key:'stat_4_num',   label:'Тоо 4',    ph:'24h' },
    { key:'stat_4_label', label:'Нэр 4',    ph:'Хүргэлт' },
  ]},
  { id:'nav', label:'Навигаци', fields:[
    { key:'nav_item1_text', label:'Цэс 1', ph:'Бүтээгдэхүүн' },
    { key:'nav_item1_link', label:'Цэс 1 линк', ph:'/products' },
    { key:'nav_item2_text', label:'Цэс 2', ph:'Үнэ тооцоол' },
    { key:'nav_item2_link', label:'Цэс 2 линк', ph:'/quote' },
    { key:'nav_item3_text', label:'Цэс 3', ph:'Дэлгүүр' },
    { key:'nav_item3_link', label:'Цэс 3 линк', ph:'/shop' },
  ]},
  { id:'footer', label:'Footer', fields:[
    { key:'footer_about',   label:'Тухай текст',  ph:'Монголын №1 хэвлэлийн платформ' },
    { key:'footer_copy',    label:'Copyright',     ph:'© 2025 BizPrint' },
    { key:'facebook_url',   label:'Facebook',       ph:'https://facebook.com/...' },
    { key:'instagram_url',  label:'Instagram',      ph:'https://instagram.com/...' },
  ]},
  { id:'seo', label:'SEO', fields:[
    { key:'seo_title',       label:'Meta Title',       ph:'BizPrint — Хэвлэлийн платформ' },
    { key:'seo_description', label:'Meta Description', ph:'Монголын №1...' },
    { key:'seo_keywords',    label:'Keywords',          ph:'хэвлэл, захиалга' },
  ]},
]

export default function AdminCMSPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'settings'|'banners'>('settings')
  const [activeGroup, setActiveGroup] = useState(0)
  const [settings, setSettings] = useState<Record<string,string>>({})
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newBanner, setNewBanner] = useState({title:'',subtitle:'',image_url:'',link:''})

  const token = () => localStorage.getItem('access_token')||''
  const hdrs = () => ({'Content-Type':'application/json',Authorization:'Bearer '+token()})

  useEffect(()=>{
    if(!token()){router.push('/login');return}
    Promise.all([
      fetch(API+'/settings',{headers:hdrs()}).then(r=>r.json()).catch(()=>[]),
      fetch(API+'/banners', {headers:hdrs()}).then(r=>r.json()).catch(()=>[]),
    ]).then(([s,b])=>{
      const map:Record<string,string>={}
      if(Array.isArray(s)) s.forEach((x:any)=>{map[x.key]=x.value})
      setSettings(map)
      setBanners(Array.isArray(b)?b:[])
      setLoading(false)
    })
  },[])

  const save = async()=>{
    setSaving(true)
    await fetch(API+'/settings/bulk',{method:'POST',headers:hdrs(),body:JSON.stringify(settings)})
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500)
  }

  const set=(k:string,v:string)=>setSettings(p=>({...p,[k]:v}))

  const toggleBanner=async(id:number,val:boolean)=>{
    await fetch(API+'/banners/'+id,{method:'PATCH',headers:hdrs(),body:JSON.stringify({is_active:val})})
    setBanners(p=>p.map(b=>b.id===id?{...b,is_active:val}:b))
  }

  const delBanner=async(id:number)=>{
    if(!confirm('Устгах уу?'))return
    await fetch(API+'/banners/'+id,{method:'DELETE',headers:hdrs()})
    setBanners(p=>p.filter(b=>b.id!==id))
  }

  const addBanner=async()=>{
    const res=await fetch(API+'/banners',{method:'POST',headers:hdrs(),body:JSON.stringify({...newBanner,is_active:true})})
    const d=await res.json()
    setBanners(p=>[...p,d])
    setNewBanner({title:'',subtitle:'',image_url:'',link:''})
    setShowAdd(false)
  }

  const inp:React.CSSProperties={width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--text)',outline:'none',fontFamily:F,boxSizing:'border-box',transition:'border-color .15s'}

  if(loading)return(
    <div style={{padding:'48px',textAlign:'center',color:'var(--text3)',fontFamily:F,fontSize:13}}>Уншиж байна...</div>
  )

  const group = GROUPS[activeGroup]

  return(
    <div style={{display:'flex',flex:1,fontFamily:F,color:'var(--text)',minHeight:'calc(100vh - 54px)'}}>

      {/* INNER SIDEBAR */}
      <div style={{width:200,borderRight:'1px solid var(--border)',padding:'12px 8px',flexShrink:0}}>
        <div style={{display:'flex',background:'var(--surface2)',borderRadius:8,padding:3,gap:2,marginBottom:12}}>
          {[['settings','Тохиргоо'],['banners','Баннер']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id as any)}
              style={{flex:1,padding:'7px 0',borderRadius:6,border:'none',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:F,background:tab===id?'var(--orange)':'transparent',color:tab===id?'#fff':'var(--text3)',transition:'all .15s'}}>
              {lbl}
            </button>
          ))}
        </div>

        {tab==='settings'&&(
          <>
            <div style={{fontSize:10,color:'var(--text4)',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'6px 8px 4px'}}>Бүлгүүд</div>
            {GROUPS.map((g,i)=>(
              <button key={g.id} onClick={()=>setActiveGroup(i)} className="cms-grp"
                style={{width:'100%',display:'flex',alignItems:'center',gap:7,padding:'8px 10px',borderRadius:7,border:'none',background:activeGroup===i?'var(--orange-10)':'transparent',color:activeGroup===i?'var(--orange)':'var(--text3)',cursor:'pointer',fontFamily:F,fontSize:12,fontWeight:activeGroup===i?500:400,marginBottom:1,textAlign:'left',transition:'all .15s'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:activeGroup===i?'var(--orange)':'var(--border)',flexShrink:0}}/>
                {g.label}
                <span style={{marginLeft:'auto',fontSize:10,color:'var(--text4)'}}>{g.fields.length}</span>
              </button>
            ))}
          </>
        )}

        {tab==='banners'&&(
          <div style={{padding:'4px 0'}}>
            <button onClick={()=>setShowAdd(!showAdd)}
              style={{width:'100%',background:'var(--orange-10)',border:'1px solid var(--orange-20)',color:'var(--orange)',borderRadius:8,padding:'9px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:F,marginBottom:10}}>
              + Баннер нэмэх
            </button>
            <div style={{padding:'12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8}}>
              <div style={{fontSize:11,color:'var(--text4)',marginBottom:4}}>Нийт</div>
              <div style={{fontSize:22,fontWeight:600,color:'var(--orange)'}}>{banners.length}</div>
              <div style={{fontSize:11,color:'#1D9E75',marginTop:4}}>Идэвхтэй: {banners.filter(b=>b.is_active).length}</div>
            </div>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:'auto',padding:'28px 32px'}}>

        {/* SAVE BUTTON ROW */}
        {tab==='settings'&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
            <div>
              <h2 style={{fontSize:18,fontWeight:600,margin:0,letterSpacing:'-0.3px'}}>{group.label}</h2>
              <p style={{fontSize:12,color:'var(--text4)',margin:'3px 0 0'}}>{group.fields.length} талбар</p>
            </div>
            <button onClick={save} disabled={saving}
              style={{background:saved?'#1D9E75':'var(--orange)',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:F,transition:'background .2s'}}>
              {saving?'Хадгалж байна...':saved?'✓ Хадгалагдлаа':'Хадгалах'}
            </button>
          </div>
        )}

        {tab==='banners'&&(
          <div style={{marginBottom:24,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
            <h2 style={{fontSize:18,fontWeight:600,margin:0}}>Баннерууд</h2>
            <p style={{fontSize:12,color:'var(--text4)',margin:'3px 0 0'}}>Нийт {banners.length} · Идэвхтэй: {banners.filter(b=>b.is_active).length}</p>
          </div>
        )}

        {/* SETTINGS */}
        {tab==='settings'&&(
          <div style={{maxWidth:640}}>
            {group.id==='colors'?(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                  {group.fields.map(f=>(
                    <div key={f.key} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
                      <label style={{display:'block',fontSize:11,color:'var(--text4)',marginBottom:10,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.label}</label>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <input type="color" value={settings[f.key]||f.ph} onChange={e=>set(f.key,e.target.value)}
                          style={{width:36,height:36,borderRadius:7,border:'1px solid var(--border)',cursor:'pointer',padding:2}}/>
                        <input type="text" value={settings[f.key]||''} placeholder={f.ph} className="cms-inp"
                          onChange={e=>set(f.key,e.target.value)} style={{...inp,width:100,fontSize:12}}/>
                        {settings[f.key]&&<div style={{width:28,height:28,borderRadius:6,background:settings[f.key],border:'1px solid var(--border)'}}/>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:16}}>
                  <div style={{fontSize:12,color:'var(--text4)',marginBottom:10}}>Урьдчилан харах</div>
                  <div style={{padding:'12px 16px',borderRadius:8,background:settings['bg_color']||'var(--bg)',border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:20,height:20,borderRadius:5,background:settings['primary_color']||'var(--orange)'}}/>
                    <span style={{fontSize:13,color:settings['text_color']||'var(--text)'}}>Жишээ текст</span>
                    <span style={{fontSize:12,color:settings['muted_color']||'var(--text3)',marginLeft:4}}>бүдэг</span>
                    <div style={{marginLeft:'auto',padding:'4px 12px',borderRadius:5,background:settings['primary_color']||'var(--orange)',fontSize:12,color:'#fff'}}>Товч</div>
                  </div>
                </div>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {group.fields.map(f=>(
                  <div key={f.key} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--border2)')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
                    <label style={{display:'block',fontSize:11,color:'var(--text4)',marginBottom:7,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.label}</label>
                    <input type="text" value={settings[f.key]||''} placeholder={f.ph} className="cms-inp"
                      onChange={e=>set(f.key,e.target.value)} style={inp}/>
                    {settings[f.key]&&<div style={{fontSize:11,color:'#1D9E75',marginTop:5}}>✓ {settings[f.key]}</div>}
                  </div>
                ))}
                <button onClick={save} disabled={saving}
                  style={{background:saved?'#1D9E75':'var(--orange)',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:F,transition:'background .2s',alignSelf:'flex-start',marginTop:4}}>
                  {saving?'Хадгалж байна...':saved?'✓ Хадгалагдлаа':'Хадгалах'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* BANNERS */}
        {tab==='banners'&&(
          <div style={{maxWidth:800}}>
            {showAdd&&(
              <div style={{background:'var(--surface)',border:'1px solid var(--orange-20)',borderRadius:12,padding:20,marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Шинэ баннер нэмэх</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                  {[['title','Гарчиг'],['subtitle','Дэд гарчиг'],['image_url','Зургийн URL'],['link','Холбоос']].map(([k,l])=>(
                    <div key={k}>
                      <label style={{fontSize:11,color:'var(--text4)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>{l}</label>
                      <input type="text" value={(newBanner as any)[k]} placeholder={l} className="cms-inp"
                        onChange={e=>setNewBanner(p=>({...p,[k]:e.target.value}))} style={inp}/>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={addBanner} style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:7,padding:'8px 18px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:F}}>Нэмэх</button>
                  <button onClick={()=>setShowAdd(false)} style={{background:'transparent',border:'1px solid var(--border)',color:'var(--text3)',borderRadius:7,padding:'8px 18px',fontSize:13,cursor:'pointer',fontFamily:F}}>Болих</button>
                </div>
              </div>
            )}

            {banners.length===0?(
              <div style={{padding:48,textAlign:'center',color:'var(--text4)',fontSize:13,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12}}>Баннер байхгүй байна</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {banners.map((b,i)=>(
                  <div key={b.id}
                    style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,transition:'background .15s'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='var(--surface)')}>
                    <div style={{fontSize:12,color:'var(--text4)',width:18,flexShrink:0}}>{i+1}</div>
                    {b.image_url?(
                      <img src={b.image_url} alt={b.title} style={{width:80,height:48,objectFit:'cover',borderRadius:7,border:'1px solid var(--border)',flexShrink:0}}/>
                    ):(
                      <div style={{width:80,height:48,background:'var(--surface2)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--border)',flexShrink:0}}>
                        <svg width="16" height="16" fill="none" stroke="var(--border2)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2}}>{b.title||'Гарчиггүй'}</div>
                      <div style={{fontSize:12,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.subtitle||b.link||'—'}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <span style={{fontSize:12,color:b.is_active?'#1D9E75':'var(--text4)'}}>{b.is_active?'Идэвхтэй':'Идэвхгүй'}</span>
                        <div onClick={()=>toggleBanner(b.id,!b.is_active)}
                          style={{width:38,height:22,borderRadius:11,background:b.is_active?'var(--orange)':'var(--border2)',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                          <div style={{position:'absolute',top:3,left:b.is_active?17:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                        </div>
                      </div>
                      <button onClick={()=>delBanner(b.id)}
                        style={{background:'rgba(226,75,74,0.08)',border:'1px solid rgba(226,75,74,0.15)',color:'#e24b4a',borderRadius:7,padding:'5px 10px',fontSize:12,cursor:'pointer',fontFamily:F}}>
                        Устгах
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}