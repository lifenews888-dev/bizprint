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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPagesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', is_published: true })

  const load = () => { apiFetch<any>('/pages/all').then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setOpen(false); setForm({ title: '', slug: '', content: '', is_published: true }) }

  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/pages/${editing.id}` : `/pages`
    try {
      await apiFetch<any>(url, { method, body: form })
      toast.success(editing?.id ? 'Хуудас шинэчлэгдлээ' : 'Хуудас үүсгэгдлээ')
      reset(); load()
    } catch { toast.error('Алдаа гарлаа') }
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch<any>(`/pages/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа')
    load()
  }

  const edit = (item: any) => {
    setEditing(item)
    setForm({ title: item.title || '', slug: item.slug || '', content: item.content || '', is_published: item.is_published !== false })
    setOpen(true)
  }

  const columns: Column<any>[] = [
    { key: 'title', label: 'Гарчиг', render: row => <span className="font-medium text-foreground">{row.title}</span> },
    { key: 'slug', label: 'Slug', render: row => <code className="text-xs text-muted-foreground font-mono">/{row.slug}</code> },
    { key: 'is_published', label: 'Төлөв', render: row => (
      <Badge variant={row.is_published !== false ? 'default' : 'destructive'} className="text-[10px]">
        {row.is_published !== false ? 'Идэвхтэй' : 'Идэвхгүй'}
      </Badge>
    )},
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
      <AdminPageHeader title="Хуудсууд" description="Статик хуудсууд (Тухай, Нөхцөл г.м)">
        <Button onClick={() => { reset(); setOpen(true) }} size="sm">
          <Plus className="h-4 w-4 mr-1" />Шинэ хуудас
        </Button>
      </AdminPageHeader>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <AdminDataTable
          data={items}
          columns={columns}
          searchKeys={['title', 'slug']}
          searchPlaceholder="Хуудас хайх..."
          loading={loading}
          emptyIcon="📄"
          emptyText="Хуудас байхгүй"
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Хуудас засах' : 'Шинэ хуудас'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-xs">Гарчиг</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="about-us" className="mt-1.5 font-mono" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Агуулга (HTML)</Label>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="mt-1.5 w-full min-h-[200px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="accent-primary" />
              Идэвхтэй
            </label>
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
