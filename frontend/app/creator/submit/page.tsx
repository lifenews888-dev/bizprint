'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch, apiUpload } from '@/lib/api'

export default function CreatorSubmitPage() {
  return <Suspense fallback={<div className="p-6 text-center"><div className="animate-spin text-3xl">⏳</div></div>}><SubmitInner /></Suspense>
}

function SubmitInner() {
  const params = useSearchParams()
  const requestId = params.get('id')
  const [request, setRequest] = useState<any>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!requestId) return
    apiFetch<any>(`/creator/requests/${requestId}`).then(setRequest).catch(() => {})
  }, [requestId])

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        const res = await apiUpload<any>('/upload/file', form)
        if (res?.file_url) urls.push(res.file_url)
      }
      setUploadedUrls(prev => [...prev, ...urls])
      setFiles([])
    } catch (e: any) {
      alert(e.message || 'Файл байршуулахад алдаа')
    }
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (uploadedUrls.length === 0) return alert('Файл байршуулна уу')
    setSubmitting(true)
    try {
      await apiFetch(`/creator/jobs/${requestId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ deliverable_urls: uploadedUrls }),
      })
      setSuccess(true)
    } catch (e: any) {
      alert(e.message || 'Алдаа гарлаа')
    }
    setSubmitting(false)
  }

  if (!requestId) return (
    <div className="p-6 text-center py-16">
      <div className="text-4xl mb-3">📂</div>
      <div className="text-sm text-[var(--text3)]">Төсөл сонгогдоогүй байна</div>
      <a href="/creator/projects" className="text-sm text-[#FF6B00] hover:underline mt-2 block">Төслүүд руу очих →</a>
    </div>
  )

  if (success) return (
    <div className="p-6 max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Амжилттай илгээгдлээ!</h2>
      <p className="text-sm text-[var(--text2)] mb-6">Захиалагч таны контентыг шалгаад хариу өгнө</p>
      <a href="/creator/projects" className="px-6 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold">Төслүүд руу буцах</a>
    </div>
  )

  return (
    <div className="p-6 max-w-[700px] mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Контент илгээх</h1>
      <p className="text-sm text-[var(--text2)] mb-6">Бэлэн болсон контентоо байршуулж илгээнэ үү</p>

      {request && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-6">
          <h3 className="text-base font-bold text-[var(--text)] mb-1">{request.title}</h3>
          <p className="text-sm text-[var(--text2)] mb-2">{request.description}</p>
          <div className="flex gap-4 text-xs text-[var(--text3)]">
            <span>📦 {request.quantity} ширхэг</span>
            <span>🔄 Засвар: {request.revision_count}/{request.max_revisions}</span>
          </div>
          {request.revision_notes && (
            <div className="mt-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3">
              <div className="text-xs font-bold text-[#F59E0B] mb-1">Засварын тэмдэглэл:</div>
              <p className="text-sm text-[var(--text)]">{request.revision_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* File upload area */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-[var(--text)] mb-3">Файл байршуулах</h3>
        <label className="block border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:border-[#FF6B00] transition-colors">
          <input type="file" multiple className="hidden"
            onChange={e => setFiles(Array.from(e.target.files || []))} />
          <div className="text-3xl mb-2">📤</div>
          <div className="text-sm text-[var(--text2)]">Файл чирж оруулах эсвэл энд дарна уу</div>
          <div className="text-xs text-[var(--text3)] mt-1">PNG, JPG, PDF, AI, PSD — 50MB хүртэл</div>
        </label>

        {files.length > 0 && (
          <div className="mt-3">
            <div className="space-y-2 mb-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-[var(--bg)] rounded-lg p-2 text-sm">
                  <span className="text-[var(--text)] truncate">{f.name}</span>
                  <span className="text-xs text-[var(--text3)]">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              ))}
            </div>
            <button onClick={handleUpload} disabled={uploading}
              className="w-full py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-bold hover:bg-[#2563EB] disabled:opacity-50">
              {uploading ? 'Байршуулж байна...' : `${files.length} файл байршуулах`}
            </button>
          </div>
        )}

        {uploadedUrls.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold text-[#10B981] mb-2">✅ Байршуулсан файлууд ({uploadedUrls.length})</div>
            <div className="space-y-1">
              {uploadedUrls.map((url, i) => (
                <div key={i} className="text-xs text-[var(--text2)] bg-[#10B981]/10 rounded-lg px-3 py-2 truncate">{url}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={submitting || uploadedUrls.length === 0}
        className="w-full py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors disabled:opacity-50">
        {submitting ? 'Илгээж байна...' : 'Контент илгээх'}
      </button>
    </div>
  )
}
