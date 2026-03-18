'use client'
import MegaNav from '@/components/nav/MegaNav'
import { useState, useEffect, useRef } from 'react'

const CATS = [
  { id:'all',     label:'Бүгд',           icon:'◈' },
  { id:'offset',  label:'Офсет хэвлэл',   icon:'◎' },
  { id:'digital', label:'Дижитал хэвлэл', icon:'◉' },
  { id:'large',   label:'Өргөн формат',   icon:'⬡' },
  { id:'book',    label:'Ном & Сэтгүүл',  icon:'◫' },
  { id:'pack',    label:'Савлагаа',        icon:'⬢' },
  { id:'promo',   label:'Промо бараа',     icon:'✦' },
]

const PRODUCTS = [
  { id:1,  name:'Визит карт',           cat:'offset',  price:25000,  minQty:100, tag:'Хамгийн их захиалагддаг', delivery:'2-3 өдөр',  img:'💳', colors:['#FF6B35','#FF9500','#FFD166'] },
  { id:2,  name:'Флаер A5',             cat:'digital', price:15000,  minQty:50,  tag:'',                         delivery:'1-2 өдөр',  img:'📄', colors:['#06D6A0','#1B9AAA','#EF476F'] },
  { id:3,  name:'Постер A3',            cat:'digital', price:35000,  minQty:10,  tag:'Шинэ загвар',              delivery:'2 өдөр',    img:'🖼️', colors:['#7400B8','#6930C3','#48BFE3'] },
  { id:4,  name:'Баннер 1×2м',          cat:'large',   price:85000,  minQty:1,   tag:'Хямдрал',                  delivery:'3-4 өдөр',  img:'🏷️', colors:['#2EC4B6','#CBF3F0','#FFBF69'] },
  { id:5,  name:'Брошур A4',            cat:'offset',  price:45000,  minQty:50,  tag:'',                         delivery:'3 өдөр',    img:'📋', colors:['#F72585','#7209B7','#3A0CA3'] },
  { id:6,  name:'Каталог',              cat:'book',    price:120000, minQty:20,  tag:'Онцлох',                   delivery:'5-7 өдөр',  img:'📚', colors:['#FF6B35','#F7C59F','#EFEFD0'] },
  { id:7,  name:'Роллап баннер',        cat:'large',   price:95000,  minQty:1,   tag:'',                         delivery:'3 өдөр',    img:'🎌', colors:['#0077B6','#00B4D8','#90E0EF'] },
  { id:8,  name:'Стикер',              cat:'digital', price:8000,   minQty:50,  tag:'Хямдрал',                  delivery:'1-2 өдөр',  img:'⭐', colors:['#FFBE0B','#FB5607','#FF006E'] },
  { id:9,  name:'Хайрцаг',             cat:'pack',    price:200000, minQty:100, tag:'',                         delivery:'7-10 өдөр', img:'📦', colors:['#3A86FF','#8338EC','#FF006E'] },
  { id:10, name:'Цамц хэвлэл',         cat:'promo',   price:25000,  minQty:10,  tag:'Шинэ',                     delivery:'4-5 өдөр',  img:'👕', colors:['#06D6A0','#118AB2','#073B4C'] },
  { id:11, name:'Тэмдэглэлийн дэвтэр', cat:'promo',   price:18000,  minQty:50,  tag:'',                         delivery:'5 өдөр',    img:'📓', colors:['#FFD60A','#003566','#001D3D'] },
  { id:12, name:'Уут / Bag',           cat:'pack',    price:15000,  minQty:100, tag:'',                         delivery:'3-4 өдөр',  img:'🛍️', colors:['#FF9F1C','#FFBF69','#CBF3F0'] },
  { id:13, name:'Календарь',           cat:'offset',  price:55000,  minQty:50,  tag:'Онцлох',                   delivery:'5 өдөр',    img:'📅', colors:['#2D00F7','#6A00F4','#8900F2'] },
  { id:14, name:'Сурталчилгааны самбар',cat:'large',  price:65000,  minQty:1,   tag:'',                         delivery:'5-7 өдөр',  img:'📢', colors:['#F20089','#D100D1','#A100F2'] },
  { id:15, name:'Ширээний хуанли',     cat:'promo',   price:22000,  minQty:20,  tag:'Шинэ',                     delivery:'4 өдөр',    img:'🗓️', colors:['#00F5D4','#00BBF9','#F15BB5'] },
]

const FEATURES = [
  { icon:'⚡', title:'AI үнэ тооцоолол', desc:'Файлаа upload хийхэд л автоматаар үнэ тооцоолно. 2 минут хангалттай.' },
  { icon:'🏭', title:'50+ хэвлэлийн газар', desc:'Монголын шилдэг хэвлэлийн газруудтай шууд холбогдоно.' },
  { icon:'🚚', title:'24 цагт хүргэлт', desc:'Яаралтай захиалгад нэг өдрийн дотор хүргэж өгнө.' },
  { icon:'✅', title:'Чанарын баталгаа', desc:'Бүх захиалгад 100% чанарын баталгаа олгоно.' },
]

export default function HomePage() {
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<number|null>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const fn = ()=>setScrollY(window.scrollY)
    window.addEventListener('scroll',fn,{passive:true})
    return()=>window.removeEventListener('scroll',fn)
  },[])

  useEffect(()=>{
    fetch('http://localhost:4000/banners/active').then(r=>r.json()).then(d=>{ if(Array.isArray(d)&&d.length) setBanners(d) }).catch(()=>{})
  },[])

  useEffect(()=>{
    if(banners.length<=1) return
    const t=setInterval(()=>setBannerIdx(i=>(i+1)%banners.length),5000)
    return()=>clearInterval(t)
  },[banners])

  const filtered = PRODUCTS.filter(p=>{
    const mc = activeCat==='all'||p.cat===activeCat
    const ms = p.name.toLowerCase().includes(search.toLowerCase())
    return mc&&ms
  })

  const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

  return(
    <div style={{background:'#FAFAF8',minHeight:'100vh',fontFamily:F,color:'#0F0F0F'}}>
      <MegaNav/>

      {/* HERO */}
      <div ref={heroRef} style={{background:'#0F0F0F',position:'relative',overflow:'hidden',minHeight:560}}>
        {/* BG pattern */}
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 20% 50%, rgba(255,107,53,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,107,53,0.08) 0%, transparent 40%)'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,107,53,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,53,0.03) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>

        {/* BANNER SLIDER */}
        {banners.length>0&&(
          <div style={{position:'absolute',inset:0}}>
            {banners.map((b,i)=>(
              <div key={b.id} style={{position:'absolute',inset:0,opacity:i===bannerIdx?0.4:0,transition:'opacity .8s'}}>
                {b.imageUrl&&<img src={b.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
              </div>
            ))}
          </div>
        )}

        <div style={{maxWidth:1280,margin:'0 auto',padding:'80px 32px',position:'relative',display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,107,53,0.15)',border:'1px solid rgba(255,107,53,0.3)',borderRadius:99,padding:'6px 16px',marginBottom:28}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#FF6B35',boxShadow:'0 0 8px #FF6B35'}}/>
              <span style={{fontSize:12,color:'#FF6B35',fontWeight:600,letterSpacing:'0.05em'}}>МОНГОЛЫН №1 ХЭВЛЭЛИЙН ПЛАТФОРМ</span>
            </div>
            <h1 style={{fontSize:'clamp(40px,4.5vw,58px)',fontWeight:800,color:'#FFFFFF',lineHeight:1.05,letterSpacing:'-1.5px',margin:'0 0 20px'}}>
              Хэвлэлийн захиалга<br/>
              <span style={{color:'#FF6B35'}}>хялбар болголоо</span>
            </h1>
            <p style={{fontSize:16,color:'#888',lineHeight:1.75,maxWidth:440,margin:'0 0 36px'}}>
              Файлаа upload хийгэд, AI-аар үнэ тооцоолж, Монголын шилдэг хэвлэлийн газруудаас шилж авна уу.
            </p>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <a href="/quote" style={{fontSize:15,fontWeight:700,color:'#fff',textDecoration:'none',padding:'14px 32px',borderRadius:12,background:'#FF6B35',display:'inline-flex',alignItems:'center',gap:8,boxShadow:'0 4px 24px rgba(255,107,53,0.4)',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(255,107,53,0.5)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 24px rgba(255,107,53,0.4)'}}>
                ⚡ Үнэ тооцоолох
              </a>
              <a href="/products" style={{fontSize:15,fontWeight:600,color:'#fff',textDecoration:'none',padding:'14px 28px',borderRadius:12,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',transition:'all .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.14)')}
                onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.08)')}>
                Бүтээгдэхүүн харах
              </a>
            </div>

            {/* STATS */}
            <div style={{display:'flex',gap:32,marginTop:48,paddingTop:32,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
              {[['1,000+','Амжилттай захиалга'],['50+','Хэвлэлийн газар'],['24ц','Яаралтай хүргэлт']].map(([n,l])=>(
                <div key={l}>
                  <div style={{fontSize:26,fontWeight:800,color:'#FF6B35',letterSpacing:'-0.5px'}}>{n}</div>
                  <div style={{fontSize:12,color:'#666',marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* HERO RIGHT - Product showcase */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {PRODUCTS.slice(0,4).map((p,i)=>(
              <div key={p.id}
                style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'20px',cursor:'pointer',transition:'all .2s',transform:i%2===1?'translateY(20px)':'translateY(0)'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,107,53,0.1)';e.currentTarget.style.borderColor='rgba(255,107,53,0.3)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
                <div style={{fontSize:32,marginBottom:12}}>{p.img}</div>
                <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:12,color:'#FF6B35',fontWeight:700}}>{p.price.toLocaleString()}₮~</div>
              </div>
            ))}
          </div>
        </div>

        {/* BANNER DOTS */}
        {banners.length>1&&(
          <div style={{position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',display:'flex',gap:6}}>
            {banners.map((_,i)=>(
              <div key={i} onClick={()=>setBannerIdx(i)}
                style={{width:i===bannerIdx?24:6,height:6,borderRadius:3,background:i===bannerIdx?'#FF6B35':'rgba(255,255,255,0.3)',cursor:'pointer',transition:'all .3s'}}/>
            ))}
          </div>
        )}
      </div>

      {/* CATEGORY TABS */}
      <div style={{background:'#fff',borderBottom:'1px solid #EBEBEB',position:'sticky',top:64,zIndex:90}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 32px',display:'flex',gap:0,overflowX:'auto'}}>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setActiveCat(c.id)}
              style={{padding:'16px 20px',border:'none',borderBottom:activeCat===c.id?'2px solid #FF6B35':'2px solid transparent',background:'transparent',fontSize:13,fontWeight:activeCat===c.id?600:450,color:activeCat===c.id?'#FF6B35':'#666',cursor:'pointer',fontFamily:F,whiteSpace:'nowrap',transition:'all .15s',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:14}}>{c.icon}</span>
              {c.label}
            </button>
          ))}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',paddingLeft:20}}>
            <span style={{fontSize:12,color:'#999'}}>{filtered.length} бүтээгдэхүүн</span>
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div style={{maxWidth:1280,margin:'0 auto',padding:'40px 32px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
          {filtered.map(p=>(
            <div key={p.id}
              onMouseEnter={()=>setHovered(p.id)}
              onMouseLeave={()=>setHovered(null)}
              style={{background:'#fff',border:'1.5px solid #EBEBEB',borderRadius:16,overflow:'hidden',cursor:'pointer',transition:'all .2s',boxShadow:hovered===p.id?'0 12px 40px rgba(255,107,53,0.15)':'0 2px 8px rgba(0,0,0,0.04)'}}>

              {/* VISUAL */}
              <div style={{height:180,background:'linear-gradient(135deg,'+p.colors[0]+'22,'+p.colors[1]+'15)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',borderBottom:'1px solid #F5F5F0'}}>
                <div style={{fontSize:56,filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.12))',transform:hovered===p.id?'scale(1.1)':'scale(1)',transition:'transform .2s'}}>{p.img}</div>
                {p.tag&&(
                  <div style={{position:'absolute',top:12,left:12,background:p.colors[0],color:'#fff',fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:6}}>
                    {p.tag}
                  </div>
                )}
                {hovered===p.id&&(
                  <div style={{position:'absolute',inset:0,background:'rgba(15,15,15,0.5)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s'}}>
                    <a href="/quote" onClick={e=>e.stopPropagation()} style={{background:'#FF6B35',color:'#fff',textDecoration:'none',fontSize:12,fontWeight:700,padding:'9px 18px',borderRadius:9}}>Үнэ авах</a>
                    <a href={'/products/'+p.id} onClick={e=>e.stopPropagation()} style={{background:'rgba(255,255,255,0.9)',color:'#0F0F0F',textDecoration:'none',fontSize:12,fontWeight:500,padding:'9px 14px',borderRadius:9}}>Харах</a>
                  </div>
                )}
              </div>

              {/* INFO */}
              <div style={{padding:'16px'}}>
                <div style={{fontSize:14,fontWeight:700,color:'#0F0F0F',marginBottom:6,lineHeight:1.3}}>{p.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
                  <svg width="12" height="12" fill="none" stroke="#999" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span style={{fontSize:11,color:'#999'}}>{p.delivery}</span>
                  <span style={{fontSize:11,color:'#DEDEDE',margin:'0 2px'}}>·</span>
                  <span style={{fontSize:11,color:'#999'}}>min {p.minQty}ш</span>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <span style={{fontSize:11,color:'#999'}}>-аас </span>
                    <span style={{fontSize:18,fontWeight:800,color:'#FF6B35',letterSpacing:'-0.5px'}}>{p.price.toLocaleString()}₮</span>
                  </div>
                  <button onClick={e=>{e.stopPropagation();window.location.href='/quote'}}
                    style={{width:36,height:36,borderRadius:10,background:'#0F0F0F',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='#FF6B35')}
                    onMouseLeave={e=>(e.currentTarget.style.background='#0F0F0F')}>
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length===0&&(
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <div style={{fontSize:48,marginBottom:16}}>🔍</div>
            <div style={{fontSize:18,fontWeight:600,color:'#333',marginBottom:8}}>Олдсонгүй</div>
            <div style={{fontSize:14,color:'#999'}}>"{search}" гэсэн бүтээгдэхүүн байхгүй байна</div>
          </div>
        )}
      </div>

      {/* FEATURES */}
      <div style={{background:'#0F0F0F',padding:'80px 32px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{fontSize:12,color:'#FF6B35',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Яагаад BizPrint?</div>
            <h2 style={{fontSize:'clamp(28px,3.5vw,42px)',fontWeight:800,color:'#fff',letterSpacing:'-1px',margin:0}}>Хэвлэлийн захиалгыг<br/><span style={{color:'#FF6B35'}}>дахин тодорхойлсон</span></h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
            {FEATURES.map(f=>(
              <div key={f.title}
                style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'28px 24px',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,107,53,0.08)';e.currentTarget.style.borderColor='rgba(255,107,53,0.2)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
                <div style={{fontSize:32,marginBottom:16}}>{f.icon}</div>
                <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:8}}>{f.title}</div>
                <div style={{fontSize:13,color:'#666',lineHeight:1.65}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{background:'#FAFAF8',padding:'80px 32px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{fontSize:12,color:'#FF6B35',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Хэрхэн ажилладаг вэ</div>
            <h2 style={{fontSize:'clamp(28px,3.5vw,42px)',fontWeight:800,color:'#0F0F0F',letterSpacing:'-1px',margin:0}}>4 алхамд бэлэн</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,position:'relative'}}>
            <div style={{position:'absolute',top:40,left:'12.5%',right:'12.5%',height:1,background:'linear-gradient(90deg,#FF6B35,#FF6B3500)',zIndex:0}}/>
            {[
              {n:'01',t:'Бүтээгдэхүүн сонго',d:'30+ төрлөөс хүссэнээ сонгоно',c:'#FF6B35'},
              {n:'02',t:'Файл upload хийх',d:'PDF, AI, PSD — бүх форматыг дэмждэг',c:'#F72585'},
              {n:'03',t:'Үнэ баталгаажуулах',d:'AI автоматаар тооцоолж баталгаажуулна',c:'#7209B7'},
              {n:'04',t:'Хүргэлт хүлээн авах',d:'24 цагаас 7 хоногийн хооронд хүргэнэ',c:'#3A86FF'},
            ].map((s,i)=>(
              <div key={s.n} style={{textAlign:'center',padding:'0 24px',position:'relative',zIndex:1}}>
                <div style={{width:80,height:80,borderRadius:20,background:s.c+'15',border:'2px solid '+s.c+'30',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:22,fontWeight:800,color:s.c}}>
                  {s.n}
                </div>
                <div style={{fontSize:15,fontWeight:700,color:'#0F0F0F',marginBottom:8}}>{s.t}</div>
                <div style={{fontSize:13,color:'#888',lineHeight:1.6}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{background:'#FF6B35',padding:'80px 32px'}}>
        <div style={{maxWidth:800,margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'clamp(32px,4vw,52px)',fontWeight:800,color:'#fff',letterSpacing:'-1.5px',margin:'0 0 16px',lineHeight:1.1}}>
            Өнөөдөр эхлэхэд<br/>бэлэн үү?
          </h2>
          <p style={{fontSize:16,color:'rgba(255,255,255,0.8)',margin:'0 0 36px',lineHeight:1.7}}>
            Бүртгүүлэх үнэгүй. Анхны захиалгад 10% хөнгөлөлт.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <a href="/register" style={{fontSize:15,fontWeight:700,color:'#FF6B35',textDecoration:'none',padding:'14px 36px',borderRadius:12,background:'#fff',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',transition:'all .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
              Үнэгүй бүртгүүлэх →
            </a>
            <a href="/quote" style={{fontSize:15,fontWeight:600,color:'#fff',textDecoration:'none',padding:'14px 28px',borderRadius:12,border:'2px solid rgba(255,255,255,0.4)',transition:'all .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.1)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              Үнэ тооцоолох
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}