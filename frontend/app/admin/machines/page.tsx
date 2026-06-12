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

const STATUS_CLR: Record<string, { label: string; color: string }> = {
  available: { label: 'Бэлэн', color: '#10B981' },
  busy: { label: 'Ачаалалтай', color: '#F59E0B' },
  maintenance: { label: 'Засвартай', color: '#EF4444' },
  offline: { label: 'Офлайн', color: '#888' },
}

type MachineStatus = keyof typeof STATUS_CLR | string

type MachineForm = {
  name: string
  type: string
  speed_per_hour: number
  sheet_width_mm: number
  sheet_height_mm: number
  hour_rate: number
  factory_id: string
  status: MachineStatus
}

type Machine = MachineForm & {
  id: number
}

const EMPTY_FORM: MachineForm = { name: '', type: '', speed_per_hour: 0, sheet_width_mm: 0, sheet_height_mm: 0, hour_rate: 0, factory_id: '', status: 'available' }

export default function AdminMachinesPage() {
  const [items, setItems] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Machine | null>(null)
  const [form, setForm] = useState<MachineForm>(EMPTY_FORM)

  const load = () => { apiFetch<Machine[]>('/machines').then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setOpen(false); setForm(EMPTY_FORM) }

  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/machines/${editing.id}` : `/machines`
    try { await apiFetch<Machine>(url, { method, body: form }); toast.success('Амжилттай'); reset(); load() }
    catch { toast.error('Алдаа') }
  }

  const del = async (id: number) => { if (!confirm('Устгах уу?')) return; await apiFetch<void>(`/machines/${id}`, { method: 'DELETE' }); toast.success('Устгагдлаа'); load() }

  const edit = (m: Machine) => {
    setEditing(m)
    setForm({ name: m.name || '', type: m.type || '', speed_per_hour: m.speed_per_hour || 0, sheet_width_mm: m.sheet_width_mm || 0, sheet_height_mm: m.sheet_height_mm || 0, hour_rate: m.hour_rate || 0, factory_id: m.factory_id || '', status: m.status || 'available' })
    setOpen(true)
  }

  const columns: Column<Machine>[] = [
    { key: 'name', label: 'Нэр', render: row => <span className="font-medium text-foreground">{row.name || '—'}</span> },
    { key: 'type', label: 'Төрөл', render: row => row.type ? <Badge variant="secondary" className="text-[10px]">{row.type}</Badge> : <span className="text-muted-foreground">—</span> },
    { key: 'speed', label: 'Хурд', render: row => <span className="text-muted-foreground">{row.speed_per_hour ? `${row.speed_per_hour} хуудас/цаг` : '—'}</span> },
    { key: 'size', label: 'Хэмжээ (мм)', render: row => <span className="text-muted-foreground">{row.sheet_width_mm && row.sheet_height_mm ? `${row.sheet_width_mm}x${row.sheet_height_mm}` : '—'}</span> },
    { key: 'hour_rate', label: 'Цагийн төлбөр', render: row => <span className="font-semibold text-primary">{`₮${Number(row.hour_rate || 0).toLocaleString()}`}</span> },
    { key: 'status', label: 'Төлөв', render: row => {
      const st = STATUS_CLR[row.status] || { label: row.status, color: '#888' }
      return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: st.color + '15', color: st.color }}>{st.label}</span>
    }},
    { key: 'actions', label: 'Үйлдэл', className: 'w-[120px]', render: row => (
      <div className="flex gap-1.5">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => edit(row)}><Pencil className="h-3 w-3 mr-1" />Засах</Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => del(row.id)}><Trash2 className="h-3 w-3" /></Button>
      </div>
    )},
  ]

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Тоног төхөөрөмж" description="Хэвлэлийн машин, принтер удирдлага">
        <Button size="sm" onClick={() => { reset(); setOpen(true) }}><Plus className="h-4 w-4 mr-1" />Шинэ машин</Button>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Нийт', value: items.length, color: '#FF6B00' },
          { label: 'Бэлэн', value: items.filter(m => m.status === 'available').length, color: '#10B981' },
          { label: 'Ачаалалтай', value: items.filter(m => m.status === 'busy').length, color: '#F59E0B' },
          { label: 'Засвартай', value: items.filter(m => m.status === 'maintenance').length, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3.5" style={{ borderTopWidth: 3, borderTopColor: s.color }}>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <AdminDataTable data={items} columns={columns} loading={loading} searchKeys={['name', 'type']} searchPlaceholder="Машин хайх..." emptyIcon="⚙️" emptyText="Машин бүртгэгдээгүй" />
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? 'Машин засах' : 'Шинэ машин'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div><Label className="text-xs">Нэр</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1.5" placeholder="Epson L1300" /></div>
            <div><Label className="text-xs">Төрөл</Label><Input value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="mt-1.5" placeholder="Inkjet / Offset" /></div>
            <div><Label className="text-xs">Төлөв</Label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="available">Бэлэн</option><option value="busy">Ачаалалтай</option><option value="maintenance">Засвартай</option><option value="offline">Офлайн</option>
              </select>
            </div>
            <div><Label className="text-xs">Хурд (хуудас/цаг)</Label><Input type="number" value={form.speed_per_hour} onChange={e => setForm({...form, speed_per_hour: +e.target.value})} className="mt-1.5" /></div>
            <div><Label className="text-xs">Өргөн (мм)</Label><Input type="number" value={form.sheet_width_mm} onChange={e => setForm({...form, sheet_width_mm: +e.target.value})} className="mt-1.5" /></div>
            <div><Label className="text-xs">Өндөр (мм)</Label><Input type="number" value={form.sheet_height_mm} onChange={e => setForm({...form, sheet_height_mm: +e.target.value})} className="mt-1.5" /></div>
            <div><Label className="text-xs">Цагийн төлбөр (₮)</Label><Input type="number" value={form.hour_rate} onChange={e => setForm({...form, hour_rate: +e.target.value})} className="mt-1.5" /></div>
            <div><Label className="text-xs">Үйлдвэр ID</Label><Input value={form.factory_id} onChange={e => setForm({...form, factory_id: e.target.value})} className="mt-1.5" /></div>
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
