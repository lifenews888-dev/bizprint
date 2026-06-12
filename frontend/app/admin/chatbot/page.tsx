'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Save, Bot, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const SETTING_KEY = 'chatbot_embed_code'

const SAMPLE = `<script
  src="https://yria.mn/widget.js"
  data-business-id="YOUR-BUSINESS-ID"
  defer>
</script>`

type CmsSettings = Record<string, string | undefined>

export default function AdminChatbotPage() {
  const [code, setCode] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [valid, setValid] = useState<{ ok: boolean; src?: string; msg?: string } | null>(null)

  useEffect(() => {
    apiFetch<CmsSettings>('/cms/settings/public')
      .then(s => {
        const v = (s && typeof s === 'object' && s[SETTING_KEY]) || ''
        setCode(v)
        setOriginal(v)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!code.trim()) { setValid(null); return }
    setValid(validateScript(code))
  }, [code])

  const dirty = code !== original

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch('/cms/settings', {
        method: 'PATCH',
        body: JSON.stringify({ [SETTING_KEY]: code }),
        headers: { 'Content-Type': 'application/json' },
      })
      setOriginal(code)
      toast.success('Чатбот код хадгалагдлаа')
    } catch {
      toast.error('Хадгалахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  const clear = async () => {
    if (!confirm('Чатботыг сайтаас устгах уу?')) return
    setSaving(true)
    try {
      await apiFetch('/cms/settings', {
        method: 'PATCH',
        body: JSON.stringify({ [SETTING_KEY]: '' }),
        headers: { 'Content-Type': 'application/json' },
      })
      setCode('')
      setOriginal('')
      toast.success('Чатбот идэвхгүй боллоо')
    } catch {
      toast.error('Устгахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const isActive = !!original.trim()

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <AdminPageHeader
        title="Чатбот холболт"
        description="Гадны чатбот үйлчилгээний embed кодыг тавьж сайтад чатын цонх харагдуулна"
      >
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {isActive ? '● Идэвхтэй' : '○ Идэвхгүй'}
        </span>
      </AdminPageHeader>

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-card p-5 mb-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div className="text-sm leading-relaxed">
            <div className="font-semibold mb-1">Хэрхэн холбох вэ?</div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Чатбот үйлчилгээ үзүүлэгчийн самбар руу нэвтэрнэ (жишээ нь yria.mn).</li>
              <li>&quot;Вэбсайт / Widget&quot; хэсгээс <b>Embed код</b> авна.</li>
              <li>Доорх талбарт <code>&lt;script ...&gt;...&lt;/script&gt;</code> бүхэлд нь буулгана.</li>
              <li><b>Хадгалах</b> товч дарна — сайтад автоматаар харагдана.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
        <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Embed код
          </div>
          {!code && (
            <button
              onClick={() => setCode(SAMPLE)}
              className="text-xs text-primary hover:underline"
            >
              Жишээ оруулах
            </button>
          )}
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={SAMPLE}
          spellCheck={false}
          className="w-full min-h-[180px] p-4 font-mono text-[13px] bg-transparent outline-none resize-y leading-relaxed"
        />
      </div>

      {/* Validation */}
      {valid && (
        <div
          className={`rounded-lg px-4 py-3 mb-4 text-sm ${
            valid.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          {valid.ok ? (
            <div>
              <div className="font-semibold mb-0.5">✓ Зөв бичигдсэн байна</div>
              {valid.src && (
                <div className="text-xs flex items-center gap-1.5 mt-1 opacity-80">
                  <ExternalLink className="h-3 w-3" />
                  <span className="font-mono break-all">{valid.src}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="font-semibold mb-0.5">⚠ Анхааруулга</div>
              <div className="text-xs">{valid.msg}</div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={!dirty || saving || (!!code && valid?.ok === false)}>
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? 'Хадгалж байна…' : dirty ? 'Хадгалах' : 'Хадгалсан'}
        </Button>
        {isActive && (
          <Button variant="outline" onClick={clear} disabled={saving} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <Trash2 className="h-4 w-4 mr-1.5" />
            Устгах
          </Button>
        )}
        {dirty && (
          <Button variant="ghost" onClick={() => setCode(original)} disabled={saving}>
            Болих
          </Button>
        )}
      </div>

      {/* Notes */}
      <div className="mt-8 rounded-lg bg-muted/30 border border-border p-4 text-xs text-muted-foreground leading-relaxed">
        <div className="font-semibold text-foreground mb-1">Тэмдэглэл</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Чатбот зөвхөн нийтийн хуудсууд дээр харагдана (админ хэсэгт харагдахгүй).</li>
          <li>Embed кодыг өөрчилбөл сайт автоматаар шинэчлэгдэнэ — хуудас refresh хийх шаардлагагүй.</li>
          <li>Зөвхөн <code>&lt;script&gt;</code> tag-г зөвшөөрнө. <code>&lt;iframe&gt;</code> зэрэг өөр элементийг дэмждэггүй.</li>
        </ul>
      </div>
    </div>
  )
}

function validateScript(raw: string): { ok: boolean; src?: string; msg?: string } {
  try {
    const tpl = document.createElement('template')
    tpl.innerHTML = raw.trim()
    const script = tpl.content.querySelector('script')
    if (!script) return { ok: false, msg: '<script> tag олдсонгүй' }
    const extra = tpl.content.children.length
    if (extra > 1) return { ok: false, msg: 'Зөвхөн нэг <script> tag оруулна уу' }
    const src = script.getAttribute('src')
    if (!src && !script.textContent?.trim()) return { ok: false, msg: 'Script-д src буюу агуулга алга' }
    if (src && !/^https?:\/\//i.test(src)) return { ok: false, msg: 'src нь http(s):// эхэлсэн байх ёстой' }
    return { ok: true, src: src || undefined }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : ''
    return { ok: false, msg: message || 'Танигдсангүй алдаа' }
  }
}
