'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'

interface Delivery {
  id: number
  status: string
  courier_name?: string
  address?: string
  created_at: string
  order?: { id: string }
}

export default function DeliveryTab() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''
  }

  useEffect(() => {
    fetch(`${API}/api/delivery`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(d => { setDeliveries(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: number, status: string) {
    await fetch(`${API}/api/delivery/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    })
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status } : d))
  }

  const STATUS_COLOR: Record<string, string> = {
    assigned: '#f59e0b',
    picked_up: '#3b82f6',
    on_the_way: '#8b5cf6',
    delivered: '#10b981',
    failed: '#ef4444',
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>Loading...</div>

  return (
    <div style={{ padding: 16 }}>
      {deliveries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          No deliveries found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deliveries.map(d => (
            <div key={d.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  Delivery #{d.id} {d.order && `— Order #${d.order.id.slice(0, 8)}`}
                </div>
                {d.courier_name && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Courier: {d.courier_name}</div>}
                {d.address && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Address: {d.address}</div>}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {new Date(d.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 600,
                  background: (STATUS_COLOR[d.status] || '#888') + '20',
                  color: STATUS_COLOR[d.status] || '#888',
                }}>
                  {d.status}
                </span>
                <select
                  value={d.status}
                  onChange={e => updateStatus(d.id, e.target.value)}
                  style={{
                    padding: '6px 10px', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                  }}>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="on_the_way">On the Way</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
