'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const API = 'http://localhost:4000'

type Role = 'admin' | 'customer' | 'designer' | 'factory' | 'sales' | 'courier' | 'vendor' | 'user'

interface Product {
  id: string
  name: string
  price?: number
  base_price?: number
  sale_price?: number
  category?: string
  thumbnail_url?: string
  description?: string
  name_mn?: string
}

const fmt = (n:number) => n.toLocaleString('mn-MN') + '₮'

export default function ShopPage() {
  const search = useSearchParams()
  const router = useRouter()
  const catFilter = search.get('category') || 'all'
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || ''
    const headers: any = {}
    if (token) headers.Authorization = `Bearer ${token}`
    fetch(`${API}/products`, { headers })
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))

    if (token) {
      fetch(`${API}/auth/me`, { headers })
        .then(r => r.json())
        .then(u => u?.id && setUser(u))
        .catch(() => {})
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => p.category && set.add(p.category))
    return ['all', ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => catFilter === 'all' || p.category === catFilter)
  }, [products, catFilter])

  const addToCart = async (productId: string) => {
    if (!user?.id) {
      alert('Нэвтэрч орно уу')
      return
    }
    setAddingId(productId)
    try {
      await fetch(`${API}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token') || '' || ''}` },
        body: JSON.stringify({ user_id: user.id, product_id: productId, quantity: 1 }),
      })
      setToast('Сагсанд нэмэгдлээ')
      setTimeout(() => setToast(''), 2500)
    } catch {
      alert('Сагслах үед алдаа гарлаа')
    }
    setAddingId(null)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      {toast && (
        <div style={{ position:'fixed', top:16, right:16, background:'#10B981', color:'#fff', padding:'10px 14px', borderRadius:10, boxShadow:'0 10px 30px rgba(0,0,0,0.2)', zIndex:2000, fontSize:13, pointerEvents:'none' }}>
          {toast}
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Дэлгүүр</h1>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>{loading ? 'Ачааллаж байна...' : `Нийт ${filtered.length} бүтээгдэхүүн`}</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => router.push(c==='all'?'/shop':`/shop?category=${encodeURIComponent(c)}`)}
              style={{
                padding:'8px 12px', borderRadius:999, border: catFilter===c?'2px solid #FF6B00':'1px solid #E5E7EB',
                background: catFilter===c?'#FFF7ED':'#fff', color:'#1C1917', fontSize:13, fontWeight:600,
                cursor:'pointer', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
              }}>
              {c==='all'?'Бүгд':c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Бүтээгдэхүүн олдсонгүй</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          {filtered.map(p => {
            const priceNum = Number(p.sale_price ?? p.base_price ?? p.price ?? 0)
            const slug = (p as any).slug || p.id
            return (
            <a key={p.id} href={`/product/${slug}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div style={{ border:'1px solid #E5E7EB', borderRadius:16, background:'#fff', overflow:'hidden', boxShadow:'0 10px 20px rgba(0,0,0,0.04)', transition:'transform .15s', cursor:'pointer' }}
                   onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
                   onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
                <div style={{ height:160, background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {p.thumbnail_url
                    ? <img src={p.thumbnail_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#FFF7ED,#F3F4F6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'0 12px' }}>Зураг байхгүй</div>}
                </div>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:6, color:'#111' }}>{p.name || p.name_mn || 'Бүтээгдэхүүн'}</div>
                  <div style={{ color:'#FF6B00', fontSize:16, fontWeight:800, marginBottom:4 }}>{fmt(priceNum)}</div>
                  {p.description && <div style={{ fontSize:12, color:'#6B7280', minHeight:34, overflow:'hidden', textOverflow:'ellipsis' }}>{p.description}</div>}
                  <div style={{ marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'#9CA3AF' }}>{p.category || 'Төрөлгүй'}</span>
                    <button
                      onClick={(e)=>{e.preventDefault(); addToCart(p.id)}}
                      disabled={addingId === p.id}
                      style={{
                        background:'#111', color:'#fff', border:'none', padding:'8px 12px', borderRadius:10,
                        fontSize:12, fontWeight:700, cursor: addingId===p.id ? 'not-allowed' : 'pointer',
                        opacity: addingId===p.id ? 0.6 : 1,
                      }}>
                      {addingId===p.id ? 'Нэмж байна...' : 'Сагслах'}
                    </button>
                  </div>
                </div>
              </div>
            </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
