'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } else {
      setError('Имэйл эсвэл нууц үг буруу байна')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-bold text-orange-500">BizPrint</a>
          <p className="text-gray-400 mt-2">Тавтай морил</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 space-y-5">
          <h1 className="text-2xl font-bold">Нэвтрэх</h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

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
            onClick={login}
            disabled={loading}
            className="w-full py-3 bg-orange-500 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
            {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
          </button>

          <p className="text-center text-gray-400 text-sm">
            Бүртгэл байхгүй юу?{' '}
            <a href="/register" className="text-orange-400 hover:underline">Бүртгүүлэх</a>
          </p>
        </div>
      </div>
    </main>
  )
}