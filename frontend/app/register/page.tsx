'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const register = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('http://localhost:4000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } else {
      setError(data.message || 'Бүртгэл үүсгэхэд алдаа гарлаа')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold text-orange-500">BizPrint</a>
          <p className="text-gray-400 mt-2">Шинэ бүртгэл үүсгэх</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 space-y-5">
          <h1 className="text-2xl font-bold">Бүртгүүлэх</h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Нэр</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Таны нэр"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Имэйл</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Нууц үг</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none"
            />
          </div>

          <button
            onClick={register}
            disabled={loading}
            className="w-full py-3 bg-orange-500 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
            {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
          </button>

          <p className="text-center text-gray-400 text-sm">
            Бүртгэлтэй юу?{' '}
            <a href="/login" className="text-orange-400 hover:underline">Нэвтрэх</a>
          </p>
        </div>
      </div>
    </main>
  )
}