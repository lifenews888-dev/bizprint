'use client'
import { notFound } from 'next/navigation'
const API = 'http://localhost:4000'

export default async function ProductPage({ params }: { params:{ slug:string }}) {
  const res = await fetch(`${API}/products`, { cache: 'no-store' })
  const list = await res.json()
  const product = Array.isArray(list) ? list.find((p:any)=>p.slug===params.slug || p.id===params.slug) : null
  if (!product) return notFound()
  const price = Number(product.sale_price ?? product.base_price ?? product.price ?? 0).toLocaleString('mn-MN')+'₮'

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px', fontFamily:"'DM Sans','Segoe UI',system-ui" }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:24 }}>
        <div style={{ border:'1px solid #E5E7EB', borderRadius:16, background:'#F3F4F6', minHeight:360, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {product.thumbnail_url
            ? <img src={product.thumbnail_url} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:16 }} />
            : <span style={{ color:'#9CA3AF' }}>Зураг байхгүй</span>}
        </div>
        <div>
          <div style={{ fontSize:28, fontWeight:800, marginBottom:8 }}>{product.name || product.name_mn}</div>
          <div style={{ color:'#FF6B00', fontSize:22, fontWeight:800, marginBottom:12 }}>{price}</div>
          {product.description && <p style={{ color:'#4B5563', lineHeight:1.6 }}>{product.description}</p>}
          <div style={{ marginTop:20, display:'flex', gap:12 }}>
            <button style={{ background:'#111', color:'#fff', border:'none', padding:'12px 18px', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
              Сагслах
            </button>
            <button style={{ background:'#FF6B00', color:'#fff', border:'none', padding:'12px 18px', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
              Шууд захиалах
            </button>
          </div>
          <div style={{ marginTop:16, fontSize:12, color:'#9CA3AF' }}>Төрөл: {product.category || 'Төрөлгүй'}</div>
        </div>
      </div>
    </div>
  )
}
