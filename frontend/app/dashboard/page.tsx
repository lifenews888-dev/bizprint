'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface Order {
  id: string
  product_id: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!userData || !token) {
      router.push('/login')
      return
    }
    const u = JSON.parse(userData)
    setUser(u)

    fetch(`http://localhost:4000/orders/customer/${u.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    paid: 'bg-blue-500/20 text-blue-400',
    in_production: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-green-500/20 text-green-400',
    shipped: 'bg-teal-500/20 text-teal-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  const statusMn: Record<string, string> = {
    pending: 'Хүлээгдэж байна',
    paid: 'Төлбөр хийгдсэн',
    in_production: 'Хэвлэж байна',
    completed: 'Дууссан',
    shipped: 'Илгээгдсэн',
    cancelled: 'Цуцлагдсан',
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-orange-500">BizPrint</a>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <button onClick={logout}
            className="px-4 py-2 border border-gray-600 rounded-lg text-sm hover:border-red-500 hover:text-red-400">
            Гарах
          </button>
        </div>
      </nav>

      <div className="px-8 py-10 max-w-5xl mx-auto">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Сайн байна уу, {user?.full_name}! 👋</h1>
          <p className="text-gray-400 mt-1">Таны захиалгуудын мэдээлэл</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Нийт захиалга', value: orders.length },
            { label: 'Хүлээгдэж байгаа', value: orders.filter(o => o.status === 'pending').length },
            { label: 'Дууссан', value: orders.filter(o => o.status === 'completed').length },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-5">
              <div className="text-3xl font-bold text-orange-400">{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <a href="/products"
            className="px-6 py-3 bg-orange-500 rounded-xl font-semibold hover:bg-orange-600">
            + Шинэ захиалга
          </a>
          <a href="/quote"
            className="px-6 py-3 border border-gray-600 rounded-xl hover:border-orange-500">
            Үнэ тооцоолох
          </a>
        </div>

        {/* Orders */}
        <div>
          <h2 className="text-xl font-bold mb-4">Миний захиалгууд</h2>
          {orders.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-10 text-center text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p>Захиалга байхгүй байна</p>
              <a href="/products" className="mt-4 inline-block text-orange-400 hover:underline">
                Эхний захиалгаа өгөх →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-gray-900 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{order.id.slice(0, 8)}...</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {order.quantity} ширхэг • {new Date(order.created_at).toLocaleDateString('mn-MN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-semibold">
                      {Number(order.total_price).toLocaleString()}₮
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${statusColor[order.status] || 'bg-gray-700 text-gray-400'}`}>
                      {statusMn[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}