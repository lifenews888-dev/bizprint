'use client'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface PaperType {
  id?: string
  name: string
  name_mn: string
  gsm: number
  price_per_sheet: number
  description?: string
  is_active: boolean
  sort_order: number
}

const emptyForm: PaperType = {
  name: '', name_mn: '', gsm: 80, price_per_sheet: 60,
  description: '', is_active: true, sort_order: 0,
}

// Default seed (DB хоосон үед нэг дарахад үүсгэх утгууд)
const DEFAULT_SEED: PaperType[] = [
  { name: '80gsm', name_mn: '80gsm (Энгийн)', gsm: 80, price_per_sheet: 60, description: 'Энгийн цагаан цаас', is_active: true, sort_order: 1 },
  { name: '100gsm', name_mn: '100gsm', gsm: 100, price_per_sheet: 80, description: '', is_active: true, sort_order: 2 },
  { name: '120gsm', name_mn: '120gsm', gsm: 120, price_per_sheet: 100, description: '', is_active: true, sort_order: 3 },
  { name: '150gsm', name_mn: '150gsm (Зузаан)', gsm: 150, price_per_sheet: 130, description: 'Зузаан цаас', is_active: true, sort_order: 4 },
  { name: '170gsm', name_mn: '170gsm (Карт)', gsm: 170, price_per_sheet: 160, description: 'Картны цаас', is_active: true, sort_order: 5 },
  { name: '200gsm', name_mn: '200gsm', gsm: 200, price_per_sheet: 200, description: '', is_active: true, sort_order: 6 },
  { name: '250gsm', name_mn: '250gsm (Хавтас)', gsm: 250, price_per_sheet: 280, description: 'Ном, каталогийн хавтас', is_active: true, sort_order: 7 },
  { name: '300gsm', name_mn: '300gsm (Картон)', gsm: 300, price_per_sheet: 350, description: 'Картон', is_active: true, sort_order: 8 },
]

export default function PaperTypesPage() {
  const [items, setItems] = useState<PaperType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState<PaperType>({ ...emptyForm })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch<PaperType[]>('/paper-types', { auth: false })
      .then(d => setItems(Array.isArray(d) ? d.sort((a, b) => a.sort_order - b.sort_order) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setDialog(true) }
  const openEdit = (it: PaperType) => { setEditId(it.id!); setForm({ ...it }); setDialog(true) }

  const save = async () => {
    if (!form.name_mn.trim()) { toast.error('Нэр оруулна уу'); return }
    setSaving(true)
    try {
      if (editId) await apiFetch(`/paper-types/${editId}`, { method: 'PATCH', body: form as any })
      else await apiFetch('/paper-types', { method: 'POST', body: form as any })
      toast.success('Хадгалагдлаа')
      setDialog(false); load()
    } catch { toast.error('Алдаа гарлаа') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    try { await apiFetch(`/paper-types/${id}`, { method: 'DELETE' }); toast.success('Устгагдлаа'); load() }
    catch { toast.error('Алдаа') }
  }

  const seedDefaults = async () => {
    if (!confirm(`Default ${DEFAULT_SEED.length} цаасны төрөл нэмэх үү?`)) return
    try {
      for (const p of DEFAULT_SEED) await apiFetch('/paper-types', { method: 'POST', body: p as any })
      toast.success('Default утгууд нэмэгдлээ'); load()
    } catch { toast.error('Алдаа') }
  }

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
      <AdminPageHeader title="Цаасны төрлүүд" description="BookPriceCalculator болон бүтээгдэхүүний хуудсанд ашиглагдана">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />Шинэ цаас
        </Button>
      </AdminPageHeader>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Ачааллаж байна...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-30">📄</div>
          <div className="text-muted-foreground font-semibold mb-4">Цаасны төрөл байхгүй</div>
          <div className="flex gap-2 justify-center">
            <Button onClick={openCreate} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Гараар нэмэх</Button>
            <Button onClick={seedDefaults} size="sm"><FileText className="h-4 w-4 mr-1" />Default утгууд нэмэх</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className={`flex items-center gap-4 p-4 rounded-xl border bg-card ${!it.is_active && 'opacity-50'}`}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {it.gsm}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{it.name_mn || it.name}</span>
                  <Badge variant="outline" className="text-[9px]">{it.gsm}gsm</Badge>
                  <Badge variant="secondary" className="text-[9px]">₮{Number(it.price_per_sheet).toLocaleString()}/хуудас</Badge>
                </div>
                {it.description && <div className="text-[11px] text-muted-foreground mt-0.5">{it.description}</div>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(it)}>
                  <Pencil className="h-3 w-3 mr-1" />Засах
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => del(it.id!)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Цаас засах' : 'Шинэ цаас'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Код</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="80gsm" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Нэр (монгол)</Label>
                <Input value={form.name_mn} onChange={e => setForm(f => ({ ...f, name_mn: e.target.value }))} placeholder="80gsm (Энгийн)" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">GSM</Label>
                <Input type="number" value={form.gsm} onChange={e => setForm(f => ({ ...f, gsm: +e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Хуудасны үнэ (₮)</Label>
                <Input type="number" value={form.price_per_sheet} onChange={e => setForm(f => ({ ...f, price_per_sheet: +e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Тайлбар (optional)</Label>
              <Input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Энгийн цагаан цаас" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-primary w-4 h-4" />
                Идэвхтэй
              </label>
              <div>
                <Label className="text-xs">Эрэмбэ</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} className="mt-1 h-8" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialog(false)}>Болих</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
