'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff, GripVertical, FileText, Phone, Layers, Rocket } from 'lucide-react'
import { toast } from 'sonner'

const TEMPLATES = [
  { value: 'default', label: 'Энгийн', icon: FileText, desc: 'Гарчиг + агуулга' },
  { value: 'contact', label: 'Холбоо барих', icon: Phone, desc: 'Форм + мэдээлэл' },
  { value: 'services', label: 'Үйлчилгээ', icon: Layers, desc: 'Grid жагсаалт' },
  { value: 'landing', label: 'Landing', icon: Rocket, desc: 'Hero + CTA' },
]

interface PageForm {
  title: string
  slug: string
  content: string
  template: string
  is_published: boolean
  thumbnail: string
  sort_order: number
  metadata: Record<string, any>
}

const emptyForm: PageForm = {
  title: '', slug: '', content: '', template: 'default',
  is_published: true, thumbnail: '', sort_order: 0, metadata: {},
}

export default function AdminPagesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<PageForm>({ ...emptyForm })
  const [tab, setTab] = useState<'list' | 'edit'>('list')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch<any>('/pages/all')
      .then(d => setItems(Array.isArray(d) ? d.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setTab('edit')
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({
      title: item.title || '',
      slug: item.slug || '',
      content: item.content || '',
      template: item.template || 'default',
      is_published: item.is_published !== false,
      thumbnail: item.thumbnail || '',
      sort_order: item.sort_order || 0,
      metadata: item.metadata || {},
    })
    setTab('edit')
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('Гарчиг оруулна уу'); return }
    setSaving(true)
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/pages/${editing.id}` : '/pages'
    try {
      await apiFetch<any>(url, { method, body: form as any })
      toast.success(editing?.id ? 'Хуудас шинэчлэгдлээ' : 'Хуудас үүсгэгдлээ')
      setTab('list')
      load()
    } catch {
      toast.error('Алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string) => {
    if (!confirm('Энэ хуудсыг устгах уу?')) return
    try {
      await apiFetch<any>(`/pages/${id}`, { method: 'DELETE' })
      toast.success('Устгагдлаа')
      load()
    } catch { toast.error('Устгахад алдаа') }
  }

  const togglePublish = async (item: any) => {
    await apiFetch<any>(`/pages/${item.id}`, { method: 'PATCH', body: { is_published: !item.is_published } })
    toast.success(item.is_published ? 'Нуугдлаа' : 'Нийтлэгдлээ')
    load()
  }

  // ─── Metadata helpers for services template ───
  const services = (form.metadata?.services || []) as any[]
  const addService = () => setForm(f => ({ ...f, metadata: { ...f.metadata, services: [...services, { title: '', description: '', icon: '📌', price: '' }] } }))
  const updateService = (i: number, key: string, val: string) => {
    const next = [...services]; next[i] = { ...next[i], [key]: val }
    setForm(f => ({ ...f, metadata: { ...f.metadata, services: next } }))
  }
  const removeService = (i: number) => setForm(f => ({ ...f, metadata: { ...f.metadata, services: services.filter((_: any, j: number) => j !== i) } }))

  // ─── LIST VIEW ───
  if (tab === 'list') return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
      <AdminPageHeader title="Хуудсууд" description="Сайтын статик хуудсууд — Тухай, Нөхцөл, Үйлчилгээ г.м">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />Шинэ хуудас
        </Button>
      </AdminPageHeader>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Ачааллаж байна...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-30">📄</div>
          <div className="text-muted-foreground font-semibold mb-2">Хуудас байхгүй</div>
          <Button onClick={openCreate} variant="outline" size="sm" className="mt-2">
            <Plus className="h-4 w-4 mr-1" />Эхний хуудас үүсгэх
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const t = TEMPLATES.find(t => t.value === item.template) || TEMPLATES[0]
            const Icon = t.icon
            return (
              <div key={item.id}
                className={`flex items-center gap-4 p-4 rounded-xl border bg-card transition-all hover:shadow-sm ${
                  item.is_published ? 'border-border' : 'border-destructive/20 opacity-60'
                }`}>
                <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">{item.title}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">/{item.slug}</Badge>
                    <Badge variant="secondary" className="text-[9px]">{t.label}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {item.content ? `${item.content.replace(/<[^>]+>/g, '').slice(0, 80)}...` : 'Агуулга байхгүй'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a href={`/page/${item.slug}`} target="_blank" rel="noopener noreferrer"
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                    title="Хуудас үзэх">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                  <button onClick={() => togglePublish(item)}
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                    title={item.is_published ? 'Нуух' : 'Нийтлэх'}>
                    {item.is_published
                      ? <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                    }
                  </button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
                    <Pencil className="h-3 w-3 mr-1" />Засах
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => del(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ─── EDIT VIEW ───
  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => setTab('list')} className="text-xs text-muted-foreground hover:text-foreground mb-1 cursor-pointer">
            ← Бүх хуудсууд
          </button>
          <h1 className="text-lg font-bold text-foreground">
            {editing?.id ? `Засах: ${editing.title}` : 'Шинэ хуудас'}
          </h1>
        </div>
        <div className="flex gap-2">
          {editing?.id && (
            <a href={`/page/${form.slug || editing.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs border rounded-lg text-muted-foreground hover:text-foreground">
              <ExternalLink className="w-3.5 h-3.5" />Урдчилж харах
            </a>
          )}
          <Button variant="outline" onClick={() => setTab('list')}>Болих</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Basic Info ── */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Үндсэн мэдээлэл</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Гарчиг *</label>
              <Input value={form.title} onChange={e => {
                const title = e.target.value
                const autoSlug = !editing?.id
                setForm(f => ({
                  ...f, title,
                  slug: autoSlug ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9а-яөүё-]/g, '').slice(0, 60) : f.slug,
                }))
              }} placeholder="Бидний тухай" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Slug (URL)</label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="about-us" className="font-mono" />
              <div className="text-[10px] text-muted-foreground mt-1">bizprint.mn/page/{form.slug || '...'}</div>
            </div>
          </div>
        </div>

        {/* ── Template selector ── */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Загвар (Template)</h3>
          <div className="grid grid-cols-4 gap-2">
            {TEMPLATES.map(t => {
              const Icon = t.icon
              const active = form.template === t.value
              return (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, template: t.value }))}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/30'
                  }`}>
                  <Icon className={`w-5 h-5 mb-2 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-xs font-semibold text-foreground">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content editor ── */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Агуулга</h3>
            <button onClick={() => setPreview(!preview)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              {preview ? '✏️ Засварлах' : '👁️ Preview'}
            </button>
          </div>
          {preview ? (
            <div className="prose prose-sm max-w-none p-4 rounded-lg border bg-background min-h-[200px]"
              dangerouslySetInnerHTML={{ __html: form.content || '<p class="text-muted-foreground">Агуулга байхгүй</p>' }} />
          ) : (
            <>
              <div className="flex gap-1 mb-2 flex-wrap">
                {[
                  { label: 'H2', tag: '<h2>', end: '</h2>' },
                  { label: 'H3', tag: '<h3>', end: '</h3>' },
                  { label: 'Bold', tag: '<strong>', end: '</strong>' },
                  { label: 'P', tag: '<p>', end: '</p>' },
                  { label: 'UL', tag: '<ul>\n<li>', end: '</li>\n</ul>' },
                  { label: 'Link', tag: '<a href="">', end: '</a>' },
                  { label: 'Img', tag: '<img src="" alt="" />', end: '' },
                ].map(b => (
                  <button key={b.label} onClick={() => setForm(f => ({ ...f, content: f.content + b.tag + b.end }))}
                    className="px-2 py-1 text-[10px] font-mono border rounded bg-muted hover:bg-muted/80 cursor-pointer">
                    {b.label}
                  </button>
                ))}
              </div>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="w-full min-h-[300px] resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="<h2>Бидний тухай</h2>\n<p>BizPrint бол хэвлэлийн салбарын платформ...</p>"
              />
            </>
          )}
        </div>

        {/* ── Landing metadata (subtitle) ── */}
        {form.template === 'landing' && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Landing тохиргоо</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Дэд гарчиг (Hero)</label>
                <Input value={form.metadata?.subtitle || ''} onChange={e => setForm(f => ({ ...f, metadata: { ...f.metadata, subtitle: e.target.value } }))}
                  placeholder="AI-тай хэвлэлийн платформ" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CTA товчлуурын текст</label>
                <Input value={form.metadata?.cta_text || ''} onChange={e => setForm(f => ({ ...f, metadata: { ...f.metadata, cta_text: e.target.value } }))}
                  placeholder="Эхлэх" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CTA URL</label>
                <Input value={form.metadata?.cta_url || ''} onChange={e => setForm(f => ({ ...f, metadata: { ...f.metadata, cta_url: e.target.value } }))}
                  placeholder="/quote" className="font-mono" />
              </div>
            </div>
          </div>
        )}

        {/* ── Services metadata ── */}
        {form.template === 'services' && (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Үйлчилгээнүүд</h3>
              <Button variant="outline" size="sm" onClick={addService} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />Нэмэх
              </Button>
            </div>
            {services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Үйлчилгээ нэмэхийн тулд "Нэмэх" дарна уу
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((s: any, i: number) => (
                  <div key={i} className="grid grid-cols-[40px_1fr_1fr_1fr_32px] gap-2 items-center">
                    <Input value={s.icon || ''} onChange={e => updateService(i, 'icon', e.target.value)}
                      className="text-center text-lg p-1" maxLength={2} />
                    <Input value={s.title || ''} onChange={e => updateService(i, 'title', e.target.value)} placeholder="Нэр" />
                    <Input value={s.description || ''} onChange={e => updateService(i, 'description', e.target.value)} placeholder="Тайлбар" />
                    <Input value={s.price || ''} onChange={e => updateService(i, 'price', e.target.value)} placeholder="Үнэ" />
                    <button onClick={() => removeService(i)} className="text-destructive hover:text-destructive/80 cursor-pointer text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings row ── */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Тохиргоо</h3>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                className="accent-primary w-4 h-4" />
              Нийтлэгдсэн
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Эрэмбэ:</label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className="w-20 h-8" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Thumbnail URL:</label>
              <Input value={form.thumbnail} onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                placeholder="https://..." className="w-64 h-8" />
            </div>
          </div>
        </div>

        {/* ── Bottom save bar ── */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setTab('list')}>Болих</Button>
          <Button onClick={save} disabled={saving} className="min-w-[120px]">
            {saving ? 'Хадгалж байна...' : editing?.id ? 'Шинэчлэх' : 'Үүсгэх'}
          </Button>
        </div>
      </div>
    </div>
  )
}
