'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Factory {
  id: number
  name: string
  machine_type: string
  speed_per_hour: number
  setup_cost: number
  run_cost: number
  current_load: number
}

export default function FactoryDashboard() {
  const router = useRouter()
  const [factories, setFactories] = useState<Factory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/factories', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then((res) => res.json())
      .then((data) => { setFactories(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className='p-8 text-center text-gray-500'>Unshij baina...</div>

  const getBadgeClass = (type: string) => {
    return type === 'Digital Press' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
  }

  const getLoadClass = (load: number) => {
    return load > 70 ? 'bg-red-500' : load > 40 ? 'bg-yellow-500' : 'bg-green-500'
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      <div className='bg-white shadow px-8 py-4 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-800'>🏭 Factory Dashboard</h1>
        <button onClick={() => router.push('/dashboard')} className='text-sm text-gray-500 hover:text-gray-700'>← Dashboard</button>
      </div>
      <div className='p-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          <div className='bg-purple-500 text-white rounded-xl p-5 text-center shadow'>
            <div className='text-3xl mb-1'>🏭</div>
            <div className='text-4xl font-bold'>{factories.length}</div>
            <div className='text-sm mt-1 opacity-90'>Нийт Factory</div>
          </div>
          <div className='bg-blue-500 text-white rounded-xl p-5 text-center shadow'>
            <div className='text-3xl mb-1'>🖨️</div>
            <div className='text-4xl font-bold'>{factories.filter(f => f.machine_type === 'Digital Press').length}</div>
            <div className='text-sm mt-1 opacity-90'>Digital Press</div>
          </div>
          <div className='bg-orange-500 text-white rounded-xl p-5 text-center shadow'>
            <div className='text-3xl mb-1'>⚙️</div>
            <div className='text-4xl font-bold'>{factories.filter(f => f.machine_type === 'Offset Press').length}</div>
            <div className='text-sm mt-1 opacity-90'>Offset Press</div>
          </div>
        </div>
        <div className='bg-white rounded-xl shadow overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <span className='font-semibold text-gray-700'>Factories жагсаалт</span>
          </div>
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 text-gray-600 uppercase text-xs'>
              <tr>
                <th className='px-6 py-3 text-left'>Нэр</th>
                <th className='px-6 py-3 text-left'>Машины төрөл</th>
                <th className='px-6 py-3 text-left'>Хурд/цаг</th>
                <th className='px-6 py-3 text-left'>Зардал</th>
                <th className='px-6 py-3 text-left'>Ачаалал</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {factories.map((f) => (
                <tr key={f.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 font-medium text-gray-800'>{f.name}</td>
                  <td className='px-6 py-4'>
                    <span className={'px-2 py-1 rounded-full text-xs font-semibold ' + getBadgeClass(f.machine_type)}>
                      {f.machine_type}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-gray-600'>{f.speed_per_hour.toLocaleString()} ш/цаг</td>
                  <td className='px-6 py-4 text-gray-600'>{f.setup_cost.toLocaleString()}₮</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <div className='w-24 bg-gray-200 rounded-full h-2'>
                        <div className={'h-2 rounded-full ' + getLoadClass(f.current_load)} style={{width: f.current_load + '%'}}></div>
                      </div>
                      <span className='text-xs text-gray-600'>{f.current_load}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
