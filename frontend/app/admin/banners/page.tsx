'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminBannersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', link: '', buttonText: '', isActive: true, order: 0 })
  const [uploading, setUploading] = useState(false)

  const load = () => { apiFetch<any>('/banners').then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setOpen(false); setForm({ title: '', description: '', imageUrl: '', link: '', buttonText: '', isActive: true, order: 0 }) }

  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/banners/${editing.id}` : `/banners`
    try {
      await apiFetch<any>(url, { method, body: form })
      toast.success(editing?.id ? 'Баннер шинэчлэгдлээ' : 'Баннер үүсгэгдлээ')
      reset(); load()
    } catch { toast.error('Алдаа гарлаа') }
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch<any>(`/banners/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа'); load()
  }

  const edit = (item: any) => {
    setEditing(item)
    setForm({ title: item.title || '', description: item.description || '', imageUrl: item.imageUrl || '', link: item.link || '', buttonText: item.buttonText || '', isActive: item.isActive !== false, order: item.order || 0 })
    setOpen(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const data = await apiFetch<any>(`/upload/file`, { method: 'POST', body: fd })
      const rawUrl = data.url || data.path || data.fileUrl
      const filename = data.filename || data.file_name || data.name
      let fullUrl = ''
      if (rawUrl) fullUrl = rawUrl.startsWith('http') ? rawUrl : `/${rawUrl}`
      else if (filename) { const clean = filename.replace('uploads/', ''); fullUrl = filename.startsWith('http') ? filename : `/uploads/${clean}` }
      if (fullUrl) { setForm(f => ({ ...f, imageUrl: fullUrl })); toast.success('Зураг амжилттай') }
    } catch { toast.error('Upload алдаа') }
    setUploading(false)
  }

  const columns: Column<any>[] = [
    { key: 'imageUrl', label: 'Зураг', className: 'w-[100px]', render: row => (
      row.imageUrl ? <img src={row.imageUrl} alt="" className="w-20 h-10 object-cover rounded-md" /> : <span className="text-muted-foreground">—</span>
    )},
    { key: 'title', label: 'Гарчиг', render: row => <span className="font-medium text-foreground">{row.title || '—'}</span> },
    { key: 'link', label: 'Линк', render: row => <code className="text-xs text-muted-foreground font-mono">{row.link || '—'}</code> },
    { key: 'isActive', label: 'Төлөв', render: row => (
      <Badge variant={row.isActive !== false ? 'default' : 'destructive'} className="text-[10px]">
        {row.isActive !== false ? 'Идэвхтэй' : 'Идэвхгүй'}
      </Badge>
    )},
    { key: 'order', label: 'Дараалал', render: row => <span className="text-muted-foreground">{row.order || 0}</span> },
    { key: 'actions', label: 'Үйлдэл', className: 'w-[120px]', render: row => (
      <div className="flex gap-1.5">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => edit(row)}>
          <Pencil className="h-3 w-3 mr-1" />Засах
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => del(row.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )},
  ]

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Баннер удирдлага" description="Нүүр хуудасны слайдер баннерууд">
        <Button onClick={() => { reset(); setOpen(true) }} size="sm">
          <Plus className="h-4 w-4 mr-1" />Шинэ баннер
        </Button>
      </AdminPageHeader>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <AdminDataTable
          data={items}
          columns={columns}
          searchKeys={['title', 'link']}
          searchPlaceholder="Баннер хайх..."
          loading={loading}
          emptyIcon="🖼️"
          emptyText="Баннер байхгүй"
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Баннер засах' : 'Шинэ баннер'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-xs">Гарчиг</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1.5" placeholder="Баннер гарчиг" />
            </div>
            <div>
              <Label className="text-xs">Товч текст</Label>
              <Input value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} className="mt-1.5" placeholder="Дэлгэрэнгүй" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Тайлбар</Label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1.5 w-full min-h-[60px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Богино тайлбар"
              />
            </div>
            <div>
              <Label className="text-xs">Зураг</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="Зургийн URL" className="flex-1" />
                <Button variant="outline" size="sm" className="relative" disabled={uploading}>
                  <Upload className="h-3.5 w-3.5 mr-1" />{uploading ? '...' : 'Upload'}
                  <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </Button>
              </div>
              {form.imageUrl && <img src={form.imageUrl} alt="" className="h-14 rounded-md mt-2 object-cover" />}
            </div>
            <div>
              <Label className="text-xs">Линк</Label>
              <Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="mt-1.5 font-mono" placeholder="/quote" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="accent-primary" />
                Идэвхтэй
              </label>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Дараалал</Label>
                <Input type="number" value={form.order} onChange={e => setForm({ ...form, order: +e.target.value })} className="w-20" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={reset}>Болих</Button>
            <Button onClick={save}>Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
