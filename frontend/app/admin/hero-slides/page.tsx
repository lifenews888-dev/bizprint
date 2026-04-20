'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import React, { apiFetch, apiUpload } from '@/lib/api'
import React, { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import React, { Button } from '@/components/ui/button'
import React, { Input } from '@/components/ui/input'
import React, { Label } from '@/components/ui/label'
import React, { Badge } from '@/components/ui/badge'
import React, { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import React, { Plus, Pencil, Trash2, GripVertical, Eye, Upload, Image as ImageIcon } from 'lucide-react'
import React, { toast } from 'sonner'
import React, { cn } from '@/lib/utils'
import React, { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import React, { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import React, { CSS } from '@dnd-kit/utilities'

const POSITIONS = [
  { value: 'left', label: 'Зүүн' },
  { value: 'center', label: 'Төв' },
  { value: 'right', label: 'Баруун' },
  { value: 'bottom-left', label: 'Зүүн доод' },
  { value: 'bottom-center', label: 'Төв доод' },
  { value: 'bottom-right', label: 'Баруун доод' },
]

const EMPTY_FORM = {
  title: '', subtitle: '', image_url: '', video_url: '', overlay: 'rgba(0,0,0,0.3)',
  cta_text: '', cta_url: '', cta_style: 'solid', cta2_text: '', cta2_url: '',
  position: 'center', tag: '', is_active: true, start_at: '', end_at: '',
}

function SortableSlide({ slide, onEdit, onDelete, onToggle }: { slide: any; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={cn('rounded-xl border border-border bg-card overflow-hidden transition-shadow', isDragging && 'shadow-xl opacity-80', !slide.is_active && 'opacity-50')}>
      <div className="flex items-center gap-3 p-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 bg-transparent border-none">
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Preview thumbnail */}
        {slide.image_url ? (
          <div className="w-32 h-20 rounded-lg overflow-hidden shrink-0 relative">
            <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: slide.overlay || 'rgba(0,0,0,0.3)' }} />
            <div className={cn('absolute inset-0 flex flex-col p-2',
              slide.position === 'center' ? 'items-center justify-center text-center' :
              slide.position === 'left' ? 'items-start justify-center' :
              slide.position === 'right' ? 'items-end justify-center text-right' :
              slide.position === 'bottom-left' ? 'items-start justify-end' :
              slide.position === 'bottom-center' ? 'items-center justify-end text-center' :
              'items-end justify-end text-right'
            )}>
              {slide.tag && <span className="text-[6px] text-white/70 uppercase tracking-wider">{slide.tag}</span>}
              <span className="text-[8px] font-bold text-white leading-tight">{slide.title}</span>
            </div>
          </div>
        ) : (
          <div className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground truncate">{slide.title || 'Гарчиггүй'}</div>
          {slide.subtitle && <div className="text-xs text-muted-foreground truncate">{slide.subtitle}</div>}
          <div className="flex gap-2 mt-1">
            {slide.cta_text && <Badge variant="secondary" className="text-[9px]">{slide.cta_text}</Badge>}
            <Badge variant="outline" className="text-[9px]">{POSITIONS.find(p => p.value === slide.position)?.label || slide.position}</Badge>
            {slide.video_url && <Badge variant="outline" className="text-[9px]">🎬 Video</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={slide.is_active ? 'default' : 'destructive'} className="text-[9px] cursor-pointer" onClick={onToggle}>
            {slide.is_active ? 'ON' : 'OFF'}
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState<any>({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const vidInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<any[]>('/cms/hero-slides')
      setSlides(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    try {
      const body = { ...form }
      if (!body.start_at) delete body.start_at
      if (!body.end_at) delete body.end_at
      if (editingId) {
        await apiFetch(`/cms/hero-slides/${editingId}`, { method: 'PATCH', body })
      } else {
        await apiFetch('/cms/hero-slides', { method: 'POST', body: { ...body, sort_order: slides.length } })
      }
      toast.success('Слайд хадгалагдлаа')
      setDialog(false); setEditingId(null); setForm({ ...EMPTY_FORM }); load()
    } catch { toast.error('Алдаа') }
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/cms/hero-slides/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа'); load()
  }

  const toggle = async (slide: any) => {
    await apiFetch(`/cms/hero-slides/${slide.id}`, { method: 'PATCH', body: { is_active: !slide.is_active } })
    toast.success(slide.is_active ? 'Идэвхгүй' : 'Идэвхтэй'); load()
  }

  const edit = (slide: any) => {
    setEditingId(slide.id)
    setForm({
      title: slide.title || '', subtitle: slide.subtitle || '', image_url: slide.image_url || '',
      video_url: slide.video_url || '', overlay: slide.overlay || 'rgba(0,0,0,0.3)',
      cta_text: slide.cta_text || '', cta_url: slide.cta_url || '', cta_style: slide.cta_style || 'solid',
      cta2_text: slide.cta2_text || '', cta2_url: slide.cta2_url || '',
      position: slide.position || 'center', tag: slide.tag || '', is_active: slide.is_active !== false,
      start_at: slide.start_at ? new Date(slide.start_at).toISOString().slice(0, 16) : '',
      end_at: slide.end_at ? new Date(slide.end_at).toISOString().slice(0, 16) : '',
    })
    setDialog(true)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'video_url') => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const isVideo = file.type.startsWith('video/')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const data = await apiUpload<{ url?: string; error?: string }>('/upload/media', fd)
      if (data?.url) {
        setForm((f: any) => ({ ...f, [field]: data.url }))
        toast.success(isVideo ? 'Видео амжилттай' : 'Зураг амжилттай')
      } else {
        toast.error('Upload алдаа: ' + (data?.error || 'URL буцаагдсангүй'))
      }
    } catch (err: any) { toast.error('Upload алдаа: ' + (err?.message || '')) }
    setUploading(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = slides.findIndex(s => s.id === active.id)
    const newIdx = slides.findIndex(s => s.id === over.id)
    const reordered = arrayMove(slides, oldIdx, newIdx)
    setSlides(reordered)
    const items = reordered.map((s, i) => ({ id: s.id, sort_order: i }))
    await apiFetch('/cms/hero-slides/reorder', { method: 'PATCH', body: { items } })
    toast.success('Дараалал хадгалагдлаа')
  }

  if (loading) return (
    <div className="p-4 md:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 bg-muted rounded-lg" />
        <div className="h-[300px] bg-muted/40 rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-[900px]">
      <AdminPageHeader title="Hero Slider" description={`${slides.length} слайд · Нүүр хуудасны дээд хэсэгт харагдана`}>
        <Button size="sm" onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); setDialog(true) }}>
          <Plus className="h-4 w-4 mr-1" />Слайд нэмэх
        </Button>
      </AdminPageHeader>

      {slides.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Hero слайд байхгүй. Default hero banner харагдана.</p>
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); setDialog(true) }}><Plus className="h-4 w-4 mr-1" />Эхний слайд нэмэх</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {slides.map(slide => (
                <SortableSlide key={slide.id} slide={slide} onEdit={() => edit(slide)} onDelete={() => del(slide.id)} onToggle={() => toggle(slide)} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Slide Editor Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Слайд засах' : 'Шинэ слайд'}</DialogTitle></DialogHeader>

          {/* Live preview */}
          <div className="relative rounded-xl overflow-hidden h-[200px] mb-4" style={{ background: form.image_url ? `url(${form.image_url}) center/cover` : 'linear-gradient(135deg, #FF6B00, #F59E0B)' }}>
            <div className="absolute inset-0" style={{ background: form.overlay || 'rgba(0,0,0,0.3)' }} />
            <div className={cn('absolute inset-0 flex flex-col p-6 z-10',
              form.position === 'center' ? 'items-center justify-center text-center' :
              form.position === 'left' ? 'items-start justify-center' :
              form.position === 'right' ? 'items-end justify-center text-right' :
              form.position === 'bottom-left' ? 'items-start justify-end' :
              form.position === 'bottom-center' ? 'items-center justify-end text-center' :
              'items-end justify-end text-right'
            )}>
              {form.tag && <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{form.tag}</div>}
              <div className="text-xl font-bold text-white leading-tight mb-1">{form.title || 'Гарчиг бичнэ үү'}</div>
              {form.subtitle && <div className="text-sm text-white/70 mb-3">{form.subtitle}</div>}
              <div className="flex gap-2">
                {form.cta_text && (
                  <span className={cn('px-4 py-2 rounded-lg text-sm font-semibold',
                    form.cta_style === 'outline' ? 'border border-white/50 text-white' :
                    form.cta_style === 'ghost' ? 'text-white bg-white/10' :
                    'bg-white text-[#FF6B00]'
                  )}>{form.cta_text}</span>
                )}
                {form.cta2_text && <span className="px-4 py-2 rounded-lg text-sm font-semibold border border-white/30 text-white">{form.cta2_text}</span>}
              </div>
            </div>
            <div className="absolute top-2 right-2 z-20"><Badge variant="secondary" className="text-[9px]"><Eye className="h-3 w-3 mr-1" />Live Preview</Badge></div>
          </div>

          <div className="grid gap-4">
            {/* Image */}
            <div>
              <Label className="text-xs">Зураг URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="flex-1" />
                <input ref={imgInputRef} type="file" accept="image/*" onChange={e => { handleMediaUpload(e, 'image_url'); e.target.value = '' }} className="hidden" />
                <Button variant="outline" size="sm" className="shrink-0" disabled={uploading} onClick={() => imgInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1" />{uploading ? '...' : 'Upload'}
                </Button>
              </div>
            </div>

            {/* Title + Subtitle */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Гарчиг</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1.5" placeholder="Хэвлэлийн үйлчилгээ" /></div>
              <div><Label className="text-xs">Дэд гарчиг</Label><Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="mt-1.5" placeholder="AI-тай үнэ тооцоолол" /></div>
            </div>

            {/* Tag + Position */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tag (жижиг текст)</Label><Input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} className="mt-1.5" placeholder="PRINT INDUSTRY" /></div>
              <div><Label className="text-xs">Байрлал</Label>
                <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* CTA 1 */}
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">CTA товч</Label><Input value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })} className="mt-1.5" placeholder="Үнэ авах" /></div>
              <div><Label className="text-xs">CTA URL</Label><Input value={form.cta_url} onChange={e => setForm({ ...form, cta_url: e.target.value })} className="mt-1.5 font-mono" placeholder="/shop" /></div>
              <div><Label className="text-xs">CTA загвар</Label>
                <select value={form.cta_style} onChange={e => setForm({ ...form, cta_style: e.target.value })} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="solid">Solid (цагаан)</option>
                  <option value="outline">Outline (хүрээтэй)</option>
                  <option value="ghost">Ghost (ил)</option>
                </select>
              </div>
            </div>

            {/* CTA 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">2-р CTA товч</Label><Input value={form.cta2_text} onChange={e => setForm({ ...form, cta2_text: e.target.value })} className="mt-1.5" placeholder="Хэрхэн ажилладаг вэ" /></div>
              <div><Label className="text-xs">2-р CTA URL</Label><Input value={form.cta2_url} onChange={e => setForm({ ...form, cta2_url: e.target.value })} className="mt-1.5 font-mono" placeholder="#how-it-works" /></div>
            </div>

            {/* Overlay + Video */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Overlay (бараан давхарга)</Label><Input value={form.overlay} onChange={e => setForm({ ...form, overlay: e.target.value })} className="mt-1.5" placeholder="rgba(0,0,0,0.3)" /></div>
              <div>
                <Label className="text-xs">Video URL (optional)</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} className="flex-1 font-mono" placeholder="https://..." />
                  <input ref={vidInputRef} type="file" accept="video/*,image/*" onChange={e => { handleMediaUpload(e, 'video_url'); e.target.value = '' }} className="hidden" />
                  <Button variant="outline" size="sm" className="shrink-0" disabled={uploading} onClick={() => vidInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1" />{uploading ? '...' : '🎬'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Эхлэх (optional)</Label><Input type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} className="mt-1.5" /></div>
              <div><Label className="text-xs">Дуусах (optional)</Label><Input type="datetime-local" value={form.end_at} onChange={e => setForm({ ...form, end_at: e.target.value })} className="mt-1.5" /></div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-primary" />
              Идэвхтэй
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialog(false)}>Болих</Button>
            <Button onClick={save}>Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
