'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import ArtworkForm from '@/components/site/ArtworkForm'

type Order = { id: string; product_name?: string; status?: string; customer_email?: string; payment_status?: string }

/** Захиалгын хэвлэх эх: файл эсвэл лого, нэр + имэйл (загварыг имэйлээр илгээнэ) */
export default function OrderUploadPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [email] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.email || '' } catch { return '' }
  })

  useEffect(() => {
    apiFetch<Order>(`/orders/${id}`).then(setOrder).catch((e) => setError(e?.message || 'Захиалга олдсонгүй'))
  }, [id])

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 20px' }}>
      <Link href="/dashboard/customer/orders" className="text-[13px] text-gray-500 hover:text-gray-900">← Миний захиалгууд</Link>
      <div className="mt-4 rounded-3xl bg-[#F5F5F5] p-6">
        {error && <p className="text-[14px] text-[#DC2626]">{error}</p>}
        {order && (
          <>
            <p className="mb-4 text-[13px] text-gray-500">
              Захиалга #{order.id.slice(-8).toUpperCase()}{order.product_name ? ` · ${order.product_name}` : ''}
            </p>
            <ArtworkForm orderId={order.id} defaultEmail={order.customer_email || email} />
          </>
        )}
      </div>
    </div>
  )
}
