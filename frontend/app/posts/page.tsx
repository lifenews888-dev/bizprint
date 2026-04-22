'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Post { id: string; title: string; slug: string; excerpt: string; thumbnail: string; category: string; created_at: string; view_count: number }

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/posts`).then(r => r.json()).then(d => setPosts(Array.isArray(d) ? d : d?.data || [])).catch(() => []).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Ачааллаж байна...</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Мэдээ & Нийтлэл</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>BizPrint-ийн шинэ мэдээ, зөвлөгөөнүүд</p>

      {posts.length === 0 && <p style={{ color: '#666' }}>Нийтлэл байхгүй байна</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 20 }}>
        {posts.map(post => (
          <a key={post.id} href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden', border: '1px solid #222' }}>
              {post.thumbnail && <img src={post.thumbnail} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
              <div style={{ padding: 16 }}>
                {post.category && <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600, textTransform: 'uppercase' }}>{post.category}</span>}
                <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 4, marginBottom: 8 }}>{post.title}</h2>
                {post.excerpt && <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{post.excerpt}</p>}
                <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
                  {new Date(post.created_at).toLocaleDateString('mn')} · {post.view_count} үзсэн
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
