'use client'

import { useEffect, useState } from 'react'

const STATUS_LABELS: Record<string, string> = {
  assigned:   'Assigned',
  picked_up:  'Picked Up',
  on_the_way: 'On The Way',
  delivered:  'Delivered',
  failed:     'Failed',
}

const STATUS_COLORS: Record<string, string> = {
  assigned:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  picked_up:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  on_the_way: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  delivered:  'bg-green-500/20 text-green-400 border-green-500/30',
  failed:     'bg-red-500/20 text-red-400 border-red-500/30',
}

const STEPS = ['assigned', 'picked_up', 'on_the_way', 'delivered']

export default function DeliveryTab() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => { fetchDeliveries() }, [])

  async function fetchDeliveries() {
    try {
      const res = await fetch('http://localhost:4000/delivery', {
        headers: { Authorization: Bearer \ },
      })
      const data = await res.json()
      setDeliveries(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(http://localhost:4000/delivery/\/status, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Bearer \,
      },
      body: JSON.stringify({ status }),
    })
    fetchDeliveries()
    setSelected(null)
  }

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading...</div>
  if (deliveries.length === 0) return (
    <div className="p-8 text-center text-gray-500">
      <div className="text-4xl mb-2">ðŸšš</div>
      <p>No deliveries</p>
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Deliveries</h2>
        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">Total: {deliveries.length}</span>
      </div>
      <div className="grid gap-3">
        {deliveries.map((d) => (
          <div
            key={d.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/40 transition-all cursor-pointer"
            onClick={() => setSelected(d.id === selected?.id ? null : d)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-mono text-sm">#{d.id}</span>
                <span className="text-white font-medium">Order #{d.order?.id ?? '-'}</span>
                {d.courier_name && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                    {d.courier_name}
                  </span>
                )}
              </div>
              <span className={px-2 py-1 rounded-full text-xs font-medium border \}>
                {STATUS_LABELS[d.status] ?? d.status}
              </span>
            </div>

            <div className="mt-3 flex items-center">
              {STEPS.map((step, i) => {
                const currentIndex = STEPS.indexOf(d.status)
                const isDone = i <= currentIndex
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={h-1.5 flex-1 rounded-full transition-all \} />
                    {i < STEPS.length - 1 && (
                      <div className={w-2 h-2 rounded-full mx-0.5 \} />
                    )}
                  </div>
                )
              })}
            </div>

            {selected?.id === d.id && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="text-gray-300">{d.address ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Phone</p>
                    <p className="text-gray-300">{d.courier_phone ?? '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={(e) => { e.stopPropagation(); updateStatus(d.id, key) }}
                      disabled={d.status === key}
                      className={px-3 py-1.5 rounded-lg text-xs font-medium transition-all \}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}