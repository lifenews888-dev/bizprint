'use client'
import { useState, useRef } from 'react'
import { apiFetch, API_URL } from '@/lib/api'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RotateCcw, Download } from 'lucide-react'

interface ImportResult {
  imported: number
  skipped: number
  errors: { row: number; sheet: string; message: string }[]
  preview: { name: string; category: string; product_type: string; price: number; status: string }[]
}

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(f: File) {
    if (!f.name.endsWith('.xlsx')) { setError('Зөвхөн .xlsx файл оруулна уу'); return }
    if (f.size > 10 * 1024 * 1024) { setError('Файлын хэмжээ 10MB-с бага байх ёстой'); return }
    setFile(f)
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const data = await apiFetch<ImportResult>('/products/import', { method: 'POST', body: fd })
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Алдаа гарлаа')
    }
    setLoading(false)
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : ''

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Excel оруулах</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Бүтээгдэхүүнийг Excel файлаас оруулах</p>
        </div>
        <a
          href={`${API_URL}/api/products/template`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--surface2)', color: 'var(--text2)', fontSize: 13, textDecoration: 'none', border: '1px solid var(--border)' }}
        >
          <Download className="w-4 h-4" /> Загвар татах
        </a>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#FF6B00' : 'var(--border)'}`,
            borderRadius: 16, padding: '60px 40px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragging ? 'rgba(255,107,0,0.05)' : 'var(--surface)',
          }}
        >
          <input ref={inputRef} type="file" accept=".xlsx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} style={{ display: 'none' }} />
          {loading ? (
            <div>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontSize: 15, color: 'var(--text2)' }}>Оруулж байна...</p>
              <p style={{ fontSize: 12, color: 'var(--text4)' }}>{file?.name}</p>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: '#FF6B00' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Excel файл чирж оруулах</p>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>эсвэл энд дарж сонгох (.xlsx, max 10MB)</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle className="w-4 h-4" style={{ color: '#EF4444' }} />
          <span style={{ fontSize: 13, color: '#EF4444' }}>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
              <CheckCircle className="w-5 h-5 mx-auto mb-1" style={{ color: '#10B981' }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>{result.imported}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Нэмэгдсэн</div>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
              <FileSpreadsheet className="w-5 h-5 mx-auto mb-1" style={{ color: '#F59E0B' }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B' }}>{result.skipped}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Давхардсан</div>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: result.errors.length ? 'rgba(239,68,68,0.1)' : 'var(--surface)', border: `1px solid ${result.errors.length ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`, textAlign: 'center' }}>
              <AlertCircle className="w-5 h-5 mx-auto mb-1" style={{ color: result.errors.length ? '#EF4444' : 'var(--text3)' }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: result.errors.length ? '#EF4444' : 'var(--text3)' }}>{result.errors.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Алдаа</div>
            </div>
          </div>

          {/* Preview table */}
          {result.preview.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Урьдчилсан харагдац</h3>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600 }}>Нэр</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600 }}>Ангилал</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600 }}>Төрөл</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text3)', fontWeight: 600 }}>Үнэ</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text3)', fontWeight: 600 }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((p, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--text)' }}>{p.name}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{p.category}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: p.product_type === 'shop' ? 'rgba(255,107,0,0.1)' : p.product_type === 'signage' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)', color: p.product_type === 'shop' ? '#FF6B00' : p.product_type === 'signage' ? '#8B5CF6' : '#3B82F6' }}>
                            {p.product_type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text)', fontWeight: 500 }}>₮{Number(p.price).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: p.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: p.status === 'active' ? '#10B981' : '#F59E0B' }}>
                            {p.status === 'active' ? 'Бэлэн' : 'Ноорог'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>Алдаанууд</h3>
              <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                {result.errors.slice(0, 20).map((e, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(239,68,68,0.1)', fontSize: 12, color: 'var(--text2)' }}>
                    <strong>{e.sheet}</strong> мөр {e.row}: {e.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset button */}
          <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: '#FF6B00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <RotateCcw className="w-4 h-4" /> Шинэ файл оруулах
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
