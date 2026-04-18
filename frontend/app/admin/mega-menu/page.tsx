'use client'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconPicker, DynamicIcon } from '@/components/admin/IconPicker'
import { PageSelector } from '@/components/admin/PageSelector'
import {
  GripVertical, X, Plus, Save, Eye, Pencil, Trash2, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Sparkles, Megaphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Sortable wrapper ───
function SortableRow({ id, children }: { id: string; children: (props: { listeners: any; attributes: any; isDragging: boolean }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined }}>
      {children({ listeners, attributes, isDragging })}
    </div>
  )
}

export default function MegaMenuManager() {
  const [menu, setMenu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'nav' | 'columns' | 'promos' | 'quicklinks' | 'features' | 'background'>('nav')

  // Homepage background theme
  const [bgTheme, setBgTheme] = useState({
    mode: 'gradient', main: 'var(--bg)', heroGlow: true, glowColor: '#FF6B00', glowOpacity: 0.04,
    sections: { feature: 'var(--surface)', categories: 'var(--bg)', products: 'var(--bg)', cta: 'var(--bg)' },
  })

  // Quick links (header right side shortcuts)
  const [quickLinks, setQuickLinks] = useState<{ label: string; url: string; icon: string; color: string }[]>([])
  const [qlDialog, setQlDialog] = useState(false)
  const [qlForm, setQlForm] = useState({ label: '', url: '', icon: '', color: '#FF6B00' })
  const [editingQlIdx, setEditingQlIdx] = useState<number | null>(null)

  // Feature strip (top bar: Хурдан хүргэлт, 24 цагт бэлэн г.м.)
  const [featureStrip, setFeatureStrip] = useState<{ icon: string; title: string; desc: string }[]>([])
  const [fsDialog, setFsDialog] = useState(false)
  const [fsForm, setFsForm] = useState({ icon: '◆', title: '', desc: '' })
  const [editingFsIdx, setEditingFsIdx] = useState<number | null>(null)

  // Nav items (old mega_menu table — Products/Services/Shop/Quote etc.)
  const [navItems, setNavItems] = useState<any[]>([])
  const [navDialog, setNavDialog] = useState(false)
  const [navForm, setNavForm] = useState({ nav_label: '', nav_url: '', nav_type: 'LINK', is_active: true, sort_order: 0, columns: '[]' })
  const [editingNavId, setEditingNavId] = useState<string | null>(null)
  // Sub-items for DROPDOWN
  const [subDialog, setSubDialog] = useState(false)
  const [subForm, setSubForm] = useState({ label: '', url: '' })
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null)
  const [editingSubNavId, setEditingSubNavId] = useState<string | null>(null)

  // Column form
  const [colDialog, setColDialog] = useState(false)
  const [colForm, setColForm] = useState({ title: '', icon: '', color: '#FF6B00' })
  const [editingColId, setEditingColId] = useState<string | null>(null)

  // Category form
  const [catDialog, setCatDialog] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', slug: '', image_url: '' })
  const [catParentColId, setCatParentColId] = useState<string | null>(null)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)

  // Item form
  const [itemDialog, setItemDialog] = useState(false)
  const [itemForm, setItemForm] = useState({ name: '', link: '', icon: '', description: '', badge: '', type: 'product' })
  const [itemParentCatId, setItemParentCatId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // Promo form
  const [promoDialog, setPromoDialog] = useState(false)
  const [promoForm, setPromoForm] = useState({ title: '', description: '', type: 'FEATURED', link: '', cta_text: '', bg_color: '#0f172a' })
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)

  // DB categories (for auto-fill)
  const [dbCategories, setDbCategories] = useState<any[]>([])

  // Expanded columns
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const load = useCallback(async () => {
    try {
      const [menus, nav, settings, cats] = await Promise.all([
        apiFetch<any[]>('/admin/mega-menu').catch(() => []),
        apiFetch<any[]>('/cms/mega-menu').catch(() => []),
        apiFetch<any>('/cms/settings/public').catch(() => null),
        apiFetch<any[]>('/categories/navigation').catch(() => []),
      ])
      if (Array.isArray(cats)) setDbCategories(cats)
      let activeMenu = menus?.[0]
      if (!activeMenu) {
        // Автоматаар шинэ mega menu үүсгэх
        activeMenu = await apiFetch<any>('/admin/mega-menu', { method: 'POST', body: { name: 'Main Menu', is_active: true } })
      }
      if (activeMenu?.id) {
        const full = await apiFetch<any>(`/admin/mega-menu/${activeMenu.id}`)
        setMenu(full)
      }
      setNavItems(Array.isArray(nav) ? nav.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : [])
      // Load quick links + feature strip from settings
      try {
        const ql = settings?.header_quick_links
        if (typeof ql === 'string') setQuickLinks(JSON.parse(ql))
        else if (Array.isArray(ql)) setQuickLinks(ql)
      } catch {}
      try {
        const fs = settings?.feature_strip
        if (typeof fs === 'string') setFeatureStrip(JSON.parse(fs))
        else if (Array.isArray(fs)) setFeatureStrip(fs)
      } catch {}
      try {
        const bg = settings?.homepage_bg_theme
        if (typeof bg === 'string') setBgTheme(prev => ({ ...prev, ...JSON.parse(bg) }))
        else if (bg && typeof bg === 'object') setBgTheme(prev => ({ ...prev, ...bg }))
      } catch {}
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ─── Nav item CRUD (old mega_menu table) ───
  const saveNavItem = async () => {
    try {
      const body = { ...navForm, columns: navForm.nav_type === 'DROPDOWN' ? JSON.parse(navForm.columns || '[]') : null }
      if (editingNavId) {
        await apiFetch(`/cms/mega-menu/${editingNavId}`, { method: 'PUT', body })
      } else {
        await apiFetch('/cms/mega-menu', { method: 'POST', body: { ...body, sort_order: navItems.length } })
      }
      toast.success('Цэс хадгалагдлаа')
      setNavDialog(false); setEditingNavId(null); load()
    } catch { toast.error('Алдаа') }
  }

  const deleteNavItem = async (id: string) => {
    if (!confirm('Цэс устгах уу?')) return
    await apiFetch(`/cms/mega-menu/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа'); load()
  }

  const toggleNavActive = async (item: any) => {
    await apiFetch(`/cms/mega-menu/${item.id}`, { method: 'PUT', body: { is_active: !item.is_active } })
    toast.success(item.is_active ? 'Идэвхгүй болгосон' : 'Идэвхжүүлсэн'); load()
  }

  const editNavItem = (item: any) => {
    setEditingNavId(item.id)
    setNavForm({
      nav_label: item.nav_label || '', nav_url: item.nav_url || '', nav_type: item.nav_type || 'LINK',
      is_active: item.is_active !== false, sort_order: item.sort_order || 0,
      columns: JSON.stringify(item.columns || [], null, 2),
    })
    setNavDialog(true)
  }

  // Sub-item helpers for DROPDOWN
  const getSubItems = (item: any): { label: string; url: string }[] => {
    try { return (item.columns || [])[0]?.items || [] } catch { return [] }
  }

  const saveSubItem = async () => {
    const nav = navItems.find(n => n.id === editingSubNavId)
    if (!nav) return
    const subs = [...getSubItems(nav)]
    if (editingSubIdx !== null) subs[editingSubIdx] = subForm
    else subs.push(subForm)
    await apiFetch(`/cms/mega-menu/${nav.id}`, { method: 'PUT', body: { columns: [{ items: subs }] } })
    toast.success('Хадгалагдлаа')
    setSubDialog(false); setEditingSubIdx(null); load()
  }

  const deleteSubItem = async (navId: string, idx: number) => {
    const nav = navItems.find(n => n.id === navId)
    if (!nav) return
    const subs = getSubItems(nav).filter((_, i) => i !== idx)
    await apiFetch(`/cms/mega-menu/${navId}`, { method: 'PUT', body: { columns: [{ items: subs }] } })
    toast.success('Устгагдлаа'); load()
  }

  // ─── Quick Links CRUD ───
  const saveQuickLinks = async (links: typeof quickLinks) => {
    try {
      await apiFetch('/cms/settings/bulk', { method: 'POST', body: { items: [{ key: 'header_quick_links', value: JSON.stringify(links) }] } })
      setQuickLinks(links)
      toast.success('Quick links хадгалагдлаа')
    } catch { toast.error('Алдаа') }
  }

  const saveQlItem = () => {
    const updated = [...quickLinks]
    if (editingQlIdx !== null) updated[editingQlIdx] = qlForm
    else updated.push(qlForm)
    saveQuickLinks(updated)
    setQlDialog(false); setEditingQlIdx(null)
  }

  const deleteQlItem = (idx: number) => {
    saveQuickLinks(quickLinks.filter((_, i) => i !== idx))
  }

  const moveQl = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= quickLinks.length) return
    const updated = [...quickLinks];
    [updated[idx], updated[target]] = [updated[target], updated[idx]]
    saveQuickLinks(updated)
  }

  // ─── Feature Strip CRUD ───
  const saveFeatureStripAll = async (items: typeof featureStrip) => {
    try {
      await apiFetch('/cms/settings/bulk', { method: 'POST', body: { items: [{ key: 'feature_strip', value: JSON.stringify(items) }] } })
      setFeatureStrip(items)
      toast.success('Feature strip хадгалагдлаа')
    } catch { toast.error('Алдаа') }
  }

  const saveFsItem = () => {
    const updated = [...featureStrip]
    if (editingFsIdx !== null) updated[editingFsIdx] = fsForm
    else updated.push(fsForm)
    saveFeatureStripAll(updated)
    setFsDialog(false); setEditingFsIdx(null)
  }

  const deleteFsItem = (idx: number) => saveFeatureStripAll(featureStrip.filter((_, i) => i !== idx))

  // ─── Background theme save ───
  const saveBgTheme = async (theme: typeof bgTheme) => {
    try {
      await apiFetch('/cms/settings/bulk', { method: 'POST', body: { items: [{ key: 'homepage_bg_theme', value: JSON.stringify(theme) }] } })
      setBgTheme(theme)
      toast.success('Background хадгалагдлаа')
    } catch { toast.error('Алдаа') }
  }

  const menuId = menu?.id

  // ─── Column CRUD ───
  const saveColumn = async () => {
    try {
      if (editingColId) {
        await apiFetch(`/admin/mega-menu/columns/${editingColId}`, { method: 'PATCH', body: colForm })
      } else {
        await apiFetch(`/admin/mega-menu/${menuId}/columns`, { method: 'POST', body: { ...colForm, order: (menu?.columns?.length || 0) } })
      }
      toast.success('Багана хадгалагдлаа')
      setColDialog(false); setEditingColId(null); setColForm({ title: '', icon: '', color: '#FF6B00' }); load()
    } catch { toast.error('Алдаа') }
  }

  const deleteColumn = async (id: string) => {
    if (!confirm('Багана устгах уу? Доторх бүх категори, item-ууд бас устна.')) return
    await apiFetch(`/admin/mega-menu/columns/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа'); load()
  }

  const editColumn = (col: any) => {
    setColForm({ title: col.title, icon: col.icon || '', color: col.color || '#FF6B00' })
    setEditingColId(col.id); setColDialog(true)
  }

  // ─── Category CRUD ───
  const saveCategory = async () => {
    try {
      if (editingCatId) {
        await apiFetch(`/admin/mega-menu/categories/${editingCatId}`, { method: 'PATCH', body: catForm })
      } else {
        await apiFetch(`/admin/mega-menu/columns/${catParentColId}/categories`, { method: 'POST', body: { ...catForm, order: 0 } })
      }
      toast.success('Категори хадгалагдлаа')
      setCatDialog(false); setEditingCatId(null); setCatForm({ name: '', slug: '', image_url: '' }); load()
    } catch { toast.error('Алдаа') }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Категори устгах уу?')) return
    await apiFetch(`/admin/mega-menu/categories/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа'); load()
  }

  // ─── Item CRUD ───
  const saveItem = async () => {
    try {
      if (editingItemId) {
        await apiFetch(`/admin/mega-menu/items/${editingItemId}`, { method: 'PATCH', body: itemForm })
      } else {
        await apiFetch(`/admin/mega-menu/categories/${itemParentCatId}/items`, { method: 'POST', body: { ...itemForm, order: 0 } })
      }
      toast.success('Item хадгалагдлаа')
      setItemDialog(false); setEditingItemId(null); setItemForm({ name: '', link: '', icon: '', description: '', badge: '', type: 'product' }); load()
    } catch { toast.error('Алдаа') }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/admin/mega-menu/items/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа'); load()
  }

  // ─── Promo CRUD ───
  const savePromo = async () => {
    try {
      if (editingPromoId) {
        await apiFetch(`/admin/mega-menu/promos/${editingPromoId}`, { method: 'PATCH', body: promoForm })
      } else {
        await apiFetch(`/admin/mega-menu/${menuId}/promos`, { method: 'POST', body: { ...promoForm, priority: (menu?.promos?.length || 0) } })
      }
      toast.success('Промо хадгалагдлаа')
      setPromoDialog(false); setEditingPromoId(null); setPromoForm({ title: '', description: '', type: 'FEATURED', link: '', cta_text: '', bg_color: '#0f172a' }); load()
    } catch { toast.error('Алдаа') }
  }

  const deletePromo = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/admin/mega-menu/promos/${id}`, { method: 'DELETE' })
    toast.success('Устгагдлаа'); load()
  }

  // ─── Column drag-and-drop ───
  const handleColumnDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const cols = menu.columns.sort((a: any, b: any) => a.order - b.order)
    const oldIdx = cols.findIndex((c: any) => c.id === active.id)
    const newIdx = cols.findIndex((c: any) => c.id === over.id)
    const reordered = arrayMove(cols, oldIdx, newIdx)
    const items = reordered.map((c: any, i: number) => ({ id: c.id, order: i }))
    setMenu({ ...menu, columns: reordered.map((c: any, i: number) => ({ ...c, order: i })) })
    await apiFetch('/admin/mega-menu/reorder/columns', { method: 'PATCH', body: { items } })
    toast.success('Дараалал хадгалагдлаа')
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  if (loading) return (
    <div className="p-4 md:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-56 bg-muted rounded-lg" />
        <div className="h-[400px] bg-muted/40 rounded-xl" />
      </div>
    </div>
  )

  if (!menu) return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Mega Menu Manager" />
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground mb-4">Mega menu байхгүй байна</p>
        <Button onClick={async () => {
          await apiFetch('/admin/mega-menu', { method: 'POST', body: { name: 'BizPrint Main Menu' } })
          toast.success('Цэс үүсгэгдлээ'); load()
        }}><Plus className="h-4 w-4 mr-1" /> Шинэ цэс үүсгэх</Button>
      </div>
    </div>
  )

  const columns = (menu.columns || []).sort((a: any, b: any) => a.order - b.order)
  const promos = (menu.promos || []).sort((a: any, b: any) => a.priority - b.priority)

  return (
    <div className="p-4 md:p-6 max-w-[1000px]">
      <AdminPageHeader title="Mega Menu Manager" description={`${columns.length} багана · ${promos.length} промо · v${menu.version}`}>
        <Badge variant={menu.is_active ? 'default' : 'secondary'}>{menu.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}</Badge>
      </AdminPageHeader>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as any)} className="mb-5">
        <TabsList className="bg-transparent p-0 gap-1">
          <TabsTrigger value="nav" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-muted">
            Навигаци ({navItems.length})
          </TabsTrigger>
          <TabsTrigger value="columns" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-muted">
            Mega Баганууд ({columns.length})
          </TabsTrigger>
          <TabsTrigger value="quicklinks" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-muted">
            Quick Links ({quickLinks.length})
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-muted">
            Feature Strip ({featureStrip.length})
          </TabsTrigger>
          <TabsTrigger value="background" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-muted">
            Background
          </TabsTrigger>
          <TabsTrigger value="promos" className="rounded-lg px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-muted">
            Промо ({promos.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ═══ NAV TAB ═══ */}
      {tab === 'nav' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Header дээрх цэсүүд (Products, Services, Shop, Quote г.м.)</p>
            <Button size="sm" onClick={() => {
              setEditingNavId(null)
              setNavForm({ nav_label: '', nav_url: '', nav_type: 'LINK', is_active: true, sort_order: navItems.length, columns: '[]' })
              setNavDialog(true)
            }}><Plus className="h-4 w-4 mr-1" />Цэс нэмэх</Button>
          </div>

          {navItems.map((item: any) => {
            const subs = getSubItems(item)
            const isDropdown = item.nav_type === 'DROPDOWN'
            const isMega = item.nav_type === 'MEGA'
            return (
              <div key={item.id} className={cn('rounded-xl border bg-card overflow-hidden', item.is_active ? 'border-border' : 'border-border/50 opacity-60')}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-mono text-muted-foreground/50 w-5 text-center">{item.sort_order}</span>
                  <Badge variant="secondary" className={cn('text-[10px] w-20 justify-center',
                    isMega ? 'bg-primary/10 text-primary' :
                    isDropdown ? 'bg-blue-500/10 text-blue-600' :
                    'bg-muted text-muted-foreground'
                  )}>{item.nav_type}</Badge>
                  <span className="font-semibold text-sm text-foreground flex-1">{item.nav_label}</span>
                  <code className="text-[11px] text-muted-foreground/50 font-mono">{item.nav_url}</code>
                  {isDropdown && <Badge variant="outline" className="text-[10px]">{subs.length} item</Badge>}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleNavActive(item)}>
                    {item.is_active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => editNavItem(item)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => deleteNavItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>

                {/* DROPDOWN sub-items */}
                {isDropdown && subs.length > 0 && (
                  <div className="border-t border-border/50 bg-muted/30 px-4 py-2">
                    {subs.map((sub: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 py-1.5 group">
                        <span className="text-xs text-muted-foreground/40 w-4">{idx + 1}</span>
                        <span className="text-sm text-foreground/80 flex-1">{sub.label}</span>
                        <code className="text-[10px] text-muted-foreground/40 font-mono">{sub.url}</code>
                        <Button variant="ghost" size="sm" className="h-5 px-1 opacity-0 group-hover:opacity-100" onClick={() => {
                          setEditingSubNavId(item.id); setEditingSubIdx(idx); setSubForm({ label: sub.label, url: sub.url }); setSubDialog(true)
                        }}><Pencil className="h-2.5 w-2.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-5 px-1 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteSubItem(item.id, idx)}><Trash2 className="h-2.5 w-2.5" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="mt-2 text-xs h-6" onClick={() => {
                      setEditingSubNavId(item.id); setEditingSubIdx(null); setSubForm({ label: '', url: '' }); setSubDialog(true)
                    }}><Plus className="h-3 w-3 mr-0.5" />Item нэмэх</Button>
                  </div>
                )}
                {isDropdown && subs.length === 0 && (
                  <div className="border-t border-border/50 bg-muted/30 px-4 py-3 text-center">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
                      setEditingSubNavId(item.id); setEditingSubIdx(null); setSubForm({ label: '', url: '' }); setSubDialog(true)
                    }}><Plus className="h-3 w-3 mr-1" />Dropdown item нэмэх</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ QUICK LINKS TAB ═══ */}
      {tab === 'quicklinks' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Header баруун талд харагдах shortcut линкүүд (Дэлгүүр, Хэвлэл, AI Quote г.м.)</p>
            <Button size="sm" onClick={() => {
              setQlForm({ label: '', url: '', icon: '', color: '#FF6B00' }); setEditingQlIdx(null); setQlDialog(true)
            }}><Plus className="h-4 w-4 mr-1" />Линк нэмэх</Button>
          </div>

          {quickLinks.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
              Quick link байхгүй. "Линк нэмэх" товч дарна уу.
            </div>
          )}

          {quickLinks.map((ql, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-xs text-muted-foreground/50 w-5 text-center">{idx + 1}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: (ql.color || '#FF6B00') + '15' }}>
                {ql.icon ? <DynamicIcon name={ql.icon} className="h-4 w-4" /> : <span className="text-sm">🔗</span>}
              </div>
              <span className="font-semibold text-sm text-foreground flex-1">{ql.label}</span>
              <code className="text-[11px] text-muted-foreground/50 font-mono">{ql.url}</code>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ql.color || '#FF6B00' }} />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveQl(idx, -1)} disabled={idx === 0}>↑</Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveQl(idx, 1)} disabled={idx === quickLinks.length - 1}>↓</Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => {
                setQlForm(ql); setEditingQlIdx(idx); setQlDialog(true)
              }}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => deleteQlItem(idx)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ BACKGROUND TAB ═══ */}
      {tab === 'background' && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Нүүр хуудасны background, glow, section өнгөний удирдлага</p>

          {/* Presets */}
          <div>
            <Label className="text-xs font-semibold mb-2 block">Бэлэн загвар</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Default', main: 'var(--bg)', glow: true, glowColor: '#FF6B00', glowOp: 0.04, feature: 'var(--surface)' },
                { name: 'Warm Glow', main: '#FFFBF5', glow: true, glowColor: '#FF6B00', glowOp: 0.08, feature: '#FFF7ED' },
                { name: 'Cool Blue', main: '#F8FAFF', glow: true, glowColor: '#3B82F6', glowOp: 0.06, feature: '#EFF6FF' },
                { name: 'Dark', main: '#0A0A0A', glow: true, glowColor: '#FF6B00', glowOp: 0.06, feature: '#111111' },
                { name: 'Purple Haze', main: '#FAF5FF', glow: true, glowColor: '#8B5CF6', glowOp: 0.06, feature: '#F5F3FF' },
                { name: 'Emerald', main: '#F0FDF4', glow: true, glowColor: '#10B981', glowOp: 0.05, feature: '#ECFDF5' },
                { name: 'Neutral', main: '#FAFAFA', glow: false, glowColor: '#000', glowOp: 0, feature: '#F5F5F5' },
                { name: 'Sunset', main: '#FFFAF0', glow: true, glowColor: '#F97316', glowOp: 0.07, feature: '#FFF7ED' },
              ].map(preset => (
                <button key={preset.name} onClick={() => {
                  const theme = { ...bgTheme, main: preset.main, heroGlow: preset.glow, glowColor: preset.glowColor, glowOpacity: preset.glowOp, sections: { ...bgTheme.sections, feature: preset.feature } }
                  saveBgTheme(theme)
                }} className="rounded-xl border border-border bg-card p-3 text-center cursor-pointer hover:border-primary transition-colors">
                  <div className="w-full h-10 rounded-lg mb-2 relative overflow-hidden" style={{ background: preset.main === 'var(--bg)' ? '#fff' : preset.main }}>
                    {preset.glow && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${preset.glowColor}30, transparent)` }} />}
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom controls */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Custom тохиргоо</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Үндсэн background</Label>
                <Input value={bgTheme.main} onChange={e => setBgTheme({ ...bgTheme, main: e.target.value })} className="mt-1.5 font-mono" placeholder="var(--bg)" />
              </div>
              <div>
                <Label className="text-xs">Glow өнгө</Label>
                <div className="flex gap-2 mt-1.5">
                  <input type="color" value={bgTheme.glowColor} onChange={e => setBgTheme({ ...bgTheme, glowColor: e.target.value })} className="w-10 h-10 rounded border-none cursor-pointer" />
                  <Input value={bgTheme.glowColor} onChange={e => setBgTheme({ ...bgTheme, glowColor: e.target.value })} className="flex-1 font-mono" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Glow тунгалаг байдал ({Math.round((bgTheme.glowOpacity || 0) * 100)}%)</Label>
                <input type="range" min="0" max="0.2" step="0.01" value={bgTheme.glowOpacity} onChange={e => setBgTheme({ ...bgTheme, glowOpacity: parseFloat(e.target.value) })} className="w-full mt-2 accent-primary" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={bgTheme.heroGlow} onChange={e => setBgTheme({ ...bgTheme, heroGlow: e.target.checked })} className="accent-primary" />
                  Hero Glow идэвхтэй
                </label>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-muted-foreground mt-4">Section background</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[10px]">Feature strip</Label><Input value={bgTheme.sections?.feature || ''} onChange={e => setBgTheme({ ...bgTheme, sections: { ...bgTheme.sections, feature: e.target.value } })} className="mt-1 font-mono text-xs" /></div>
              <div><Label className="text-[10px]">Categories</Label><Input value={bgTheme.sections?.categories || ''} onChange={e => setBgTheme({ ...bgTheme, sections: { ...bgTheme.sections, categories: e.target.value } })} className="mt-1 font-mono text-xs" /></div>
              <div><Label className="text-[10px]">Products</Label><Input value={bgTheme.sections?.products || ''} onChange={e => setBgTheme({ ...bgTheme, sections: { ...bgTheme.sections, products: e.target.value } })} className="mt-1 font-mono text-xs" /></div>
              <div><Label className="text-[10px]">CTA</Label><Input value={bgTheme.sections?.cta || ''} onChange={e => setBgTheme({ ...bgTheme, sections: { ...bgTheme.sections, cta: e.target.value } })} className="mt-1 font-mono text-xs" /></div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => saveBgTheme(bgTheme)}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="text-xs font-semibold text-muted-foreground px-4 py-2 border-b border-border bg-muted/50">Preview</div>
            <div className="relative h-[200px]" style={{ background: bgTheme.main === 'var(--bg)' ? '#fff' : bgTheme.main }}>
              {bgTheme.heroGlow && (
                <div className="absolute top-0 left-0 right-0 h-full" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${bgTheme.glowColor}${Math.round((bgTheme.glowOpacity || 0.04) * 255).toString(16).padStart(2, '0')}, transparent)` }} />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: bgTheme.sections?.feature === 'var(--surface)' ? '#f8f8f8' : bgTheme.sections?.feature || '#f8f8f8' }} />
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/50">Нүүр хуудас preview</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FEATURE STRIP TAB ═══ */}
      {tab === 'features' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Нүүр хуудасны дээд хэсэгт харагдах давуу тал (Хурдан хүргэлт, 24 цагт бэлэн г.м.)</p>
            <Button size="sm" onClick={() => {
              setFsForm({ icon: '◆', title: '', desc: '' }); setEditingFsIdx(null); setFsDialog(true)
            }}><Plus className="h-4 w-4 mr-1" />Нэмэх</Button>
          </div>

          {featureStrip.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
              Feature strip байхгүй. Default утга харагдана.
            </div>
          )}

          {featureStrip.map((f, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-lg w-6 text-center">{f.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => {
                setFsForm(f); setEditingFsIdx(idx); setFsDialog(true)
              }}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => deleteFsItem(idx)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ COLUMNS TAB ═══ */}
      {tab === 'columns' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setColForm({ title: '', icon: '', color: '#FF6B00' }); setEditingColId(null); setColDialog(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Багана нэмэх
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
            <SortableContext items={columns.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
              {columns.map((col: any) => {
                const isExpanded = expanded.has(col.id)
                const cats = (col.categories || []).sort((a: any, b: any) => a.order - b.order)
                return (
                  <SortableRow key={col.id} id={col.id}>
                    {({ listeners, attributes, isDragging }) => (
                      <div className={cn('rounded-xl border border-border bg-card overflow-hidden transition-shadow', isDragging && 'shadow-xl opacity-80')}>
                        {/* Column header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5">
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <button onClick={() => toggleExpand(col.id)} className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer bg-transparent border-none">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color || '#FF6B00' }} />
                          {col.icon && <DynamicIcon name={col.icon} className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-semibold text-sm text-foreground flex-1">{col.title}</span>
                          <Badge variant="secondary" className="text-[10px]">{cats.length} категори</Badge>
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => editColumn(col)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => deleteColumn(col.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>

                        {/* Expanded: categories + items */}
                        {isExpanded && (
                          <div className="px-4 py-3 bg-muted/30">
                            {cats.map((cat: any) => {
                              const items = (cat.items || []).sort((a: any, b: any) => a.order - b.order)
                              return (
                                <div key={cat.id} className="mb-3 last:mb-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs font-bold text-foreground/80">{cat.name}</span>
                                    {cat.is_featured && <Badge variant="default" className="text-[8px] px-1 py-0">Featured</Badge>}
                                    <code className="text-[10px] text-muted-foreground/50 font-mono">{cat.slug}</code>
                                    <div className="flex gap-1 ml-auto">
                                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => {
                                        setItemParentCatId(cat.id); setEditingItemId(null)
                                        setItemForm({ name: '', link: '', icon: '', description: '', badge: '', type: 'product' })
                                        setItemDialog(true)
                                      }}><Plus className="h-3 w-3 mr-0.5" />Item</Button>
                                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-destructive" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                  </div>
                                  {items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-2 pl-4 py-1 text-sm hover:bg-muted/50 rounded transition-colors group">
                                      {item.icon && <DynamicIcon name={item.icon} className="h-3.5 w-3.5 text-muted-foreground" />}
                                      <span className="text-foreground/80">{item.name}</span>
                                      {item.badge && (
                                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                                          item.badge === 'AI' ? 'bg-violet-100 text-violet-600' :
                                          item.badge === 'NEW' ? 'bg-emerald-100 text-emerald-600' :
                                          item.badge === 'HOT' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                        )}>{item.badge}</span>
                                      )}
                                      <code className="text-[10px] text-muted-foreground/40 font-mono ml-auto">{item.link}</code>
                                      <Button variant="ghost" size="sm" className="h-5 px-1 opacity-0 group-hover:opacity-100" onClick={() => {
                                        setEditingItemId(item.id); setItemParentCatId(cat.id)
                                        setItemForm({ name: item.name, link: item.link || '', icon: item.icon || '', description: item.description || '', badge: item.badge || '', type: item.type || 'product' })
                                        setItemDialog(true)
                                      }}><Pencil className="h-2.5 w-2.5" /></Button>
                                      <Button variant="ghost" size="sm" className="h-5 px-1 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                                    </div>
                                  ))}
                                </div>
                              )
                            })}
                            <Button variant="outline" size="sm" className="mt-2 text-xs h-7" onClick={() => {
                              setCatParentColId(col.id); setEditingCatId(null)
                              setCatForm({ name: '', slug: '', image_url: '' })
                              setCatDialog(true)
                            }}><Plus className="h-3 w-3 mr-1" /> Категори нэмэх</Button>
                            {dbCategories.length > 0 && (
                              <Button variant="ghost" size="sm" className="mt-2 text-xs h-7 text-primary" onClick={async () => {
                                if (!confirm(`DB-ээс ${dbCategories.length} ангилалын дэд ангилалуудыг энэ баганад items болгож нэмэх үү?`)) return
                                for (const cat of dbCategories) {
                                  if (!cat.children?.length) continue
                                  // Create category
                                  const created = await apiFetch<any>(`/admin/mega-menu/columns/${col.id}/categories`, {
                                    method: 'POST', body: { name: cat.name_mn || cat.name, slug: cat.slug || '', order: 0 }
                                  })
                                  // Create items from children
                                  if (created?.id) {
                                    for (const ch of cat.children) {
                                      await apiFetch(`/admin/mega-menu/categories/${created.id}/items`, {
                                        method: 'POST',
                                        body: { name: ch.name_mn || ch.name, link: `/shop?category=${ch.slug}`, type: 'link', order: 0 }
                                      })
                                    }
                                  }
                                }
                                toast.success('DB ангилалууд нэмэгдлээ')
                                load()
                              }}>📦 DB-ээс нэмэх</Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </SortableRow>
                )
              })}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* ═══ PROMOS TAB ═══ */}
      {tab === 'promos' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => {
              setPromoForm({ title: '', description: '', type: 'FEATURED', link: '', cta_text: '', bg_color: '#0f172a' })
              setEditingPromoId(null); setPromoDialog(true)
            }}><Plus className="h-4 w-4 mr-1" /> Промо нэмэх</Button>
          </div>
          {promos.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.bg_color || '#0f172a' }} />
              {p.type === 'AI_QUOTE' && <Sparkles className="h-4 w-4 text-violet-500" />}
              {p.type === 'CAMPAIGN' && <Megaphone className="h-4 w-4 text-blue-500" />}
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.description?.slice(0, 60)}</div>
              </div>
              <Badge variant="secondary" className="text-[10px]">{p.type}</Badge>
              <Badge variant={p.is_active ? 'default' : 'destructive'} className="text-[10px]">{p.is_active ? 'ON' : 'OFF'}</Badge>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => {
                setEditingPromoId(p.id)
                setPromoForm({ title: p.title, description: p.description || '', type: p.type, link: p.link || '', cta_text: p.cta_text || '', bg_color: p.bg_color || '#0f172a' })
                setPromoDialog(true)
              }}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => deletePromo(p.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ DIALOGS ═══ */}

      {/* Column Dialog */}
      <Dialog open={colDialog} onOpenChange={setColDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingColId ? 'Багана засах' : 'Шинэ багана'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div><Label className="text-xs">Нэр</Label><Input value={colForm.title} onChange={e => setColForm({ ...colForm, title: e.target.value })} className="mt-1.5" placeholder="ОФСЕТ ХЭВЛЭЛ" /></div>
            <div><Label className="text-xs">Икон</Label><div className="mt-1.5"><IconPicker value={colForm.icon} onChange={icon => setColForm({ ...colForm, icon })} /></div></div>
            <div><Label className="text-xs">Өнгө</Label><div className="flex gap-2 mt-1.5">
              <input type="color" value={colForm.color} onChange={e => setColForm({ ...colForm, color: e.target.value })} className="w-10 h-10 rounded border-none cursor-pointer" />
              <Input value={colForm.color} onChange={e => setColForm({ ...colForm, color: e.target.value })} className="flex-1 font-mono" />
            </div></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setColDialog(false)}>Болих</Button>
            <Button onClick={saveColumn}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingCatId ? 'Категори засах' : 'Шинэ категори'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            {/* DB ангилалаас сонгох */}
            {!editingCatId && dbCategories.length > 0 && (
              <div>
                <Label className="text-xs">DB ангилалаас сонгох (хурдан)</Label>
                <select
                  className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value=""
                  onChange={e => {
                    const cat = dbCategories.find((c: any) => c.id === e.target.value)
                    if (cat) setCatForm({ name: cat.name_mn || cat.name, slug: cat.slug || '', image_url: cat.image_url || '' })
                  }}
                >
                  <option value="">-- Сонгох эсвэл доор гараар бичих --</option>
                  {dbCategories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name_mn || c.name}{c.children?.length ? ` (${c.children.length} дэд)` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div><Label className="text-xs">Нэр</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="mt-1.5" placeholder="Нэрийн хуудас" /></div>
            <div><Label className="text-xs">Slug</Label><Input value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} className="mt-1.5 font-mono" placeholder="business-card" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCatDialog(false)}>Болих</Button>
            <Button onClick={saveCategory}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingItemId ? 'Item засах' : 'Шинэ item'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div><Label className="text-xs">Нэр</Label><Input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1.5" placeholder="Визит карт" /></div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input value={itemForm.link} onChange={e => setItemForm({ ...itemForm, link: e.target.value })} className="mt-1.5 font-mono" placeholder="/shop?cat=business-card" />
              <div className="mt-1.5"><PageSelector onSelect={url => setItemForm({ ...itemForm, link: url })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Икон</Label><div className="mt-1.5"><IconPicker value={itemForm.icon} onChange={icon => setItemForm({ ...itemForm, icon })} /></div></div>
              <div><Label className="text-xs">Badge</Label>
                <select value={itemForm.badge} onChange={e => setItemForm({ ...itemForm, badge: e.target.value })} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Байхгүй</option>
                  <option value="NEW">NEW</option>
                  <option value="HOT">HOT</option>
                  <option value="AI">AI</option>
                  <option value="SALE">SALE</option>
                </select>
              </div>
            </div>
            <div><Label className="text-xs">Тайлбар</Label><Input value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="mt-1.5" placeholder="250-400gsm, 1-2 тал" /></div>
            <div><Label className="text-xs">Төрөл</Label>
              <select value={itemForm.type} onChange={e => setItemForm({ ...itemForm, type: e.target.value })} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="product">Product</option>
                <option value="template">Template</option>
                <option value="action">Action</option>
                <option value="link">Link</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setItemDialog(false)}>Болих</Button>
            <Button onClick={saveItem}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promo Dialog */}
      <Dialog open={promoDialog} onOpenChange={setPromoDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingPromoId ? 'Промо засах' : 'Шинэ промо'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div><Label className="text-xs">Гарчиг</Label><Input value={promoForm.title} onChange={e => setPromoForm({ ...promoForm, title: e.target.value })} className="mt-1.5" /></div>
            <div><Label className="text-xs">Тайлбар</Label><textarea value={promoForm.description} onChange={e => setPromoForm({ ...promoForm, description: e.target.value })} rows={2} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Төрөл</Label>
                <select value={promoForm.type} onChange={e => setPromoForm({ ...promoForm, type: e.target.value })} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="AI_QUOTE">AI Quote</option>
                  <option value="CAMPAIGN">Campaign</option>
                  <option value="FEATURED">Featured</option>
                  <option value="BANNER">Banner</option>
                </select>
              </div>
              <div><Label className="text-xs">Background</Label><div className="flex gap-2 mt-1.5">
                <input type="color" value={promoForm.bg_color} onChange={e => setPromoForm({ ...promoForm, bg_color: e.target.value })} className="w-10 h-10 rounded border-none cursor-pointer" />
                <Input value={promoForm.bg_color} onChange={e => setPromoForm({ ...promoForm, bg_color: e.target.value })} className="flex-1 font-mono" />
              </div></div>
            </div>
            <div><Label className="text-xs">URL</Label><Input value={promoForm.link} onChange={e => setPromoForm({ ...promoForm, link: e.target.value })} className="mt-1.5 font-mono" /></div>
            <div><Label className="text-xs">CTA товч текст</Label><Input value={promoForm.cta_text} onChange={e => setPromoForm({ ...promoForm, cta_text: e.target.value })} className="mt-1.5" placeholder="Тооцоолох →" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPromoDialog(false)}>Болих</Button>
            <Button onClick={savePromo}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nav Item Dialog */}
      <Dialog open={navDialog} onOpenChange={setNavDialog}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingNavId ? 'Цэс засах' : 'Шинэ цэс'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Нэр</Label><Input value={navForm.nav_label} onChange={e => setNavForm({ ...navForm, nav_label: e.target.value })} className="mt-1.5" placeholder="Services" /></div>
              <div><Label className="text-xs">Төрөл</Label>
                <select value={navForm.nav_type} onChange={e => setNavForm({ ...navForm, nav_type: e.target.value })} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="LINK">LINK — Энгийн линк</option>
                  <option value="DROPDOWN">DROPDOWN — Dropdown цэс</option>
                  <option value="MEGA">MEGA — Mega menu</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input value={navForm.nav_url} onChange={e => setNavForm({ ...navForm, nav_url: e.target.value })} className="mt-1.5 font-mono" placeholder="/shop" />
              <div className="mt-1.5"><PageSelector onSelect={url => setNavForm({ ...navForm, nav_url: url })} /></div>
            </div>
            <div><Label className="text-xs">Дараалал</Label>
              <Input type="number" value={navForm.sort_order} onChange={e => setNavForm({ ...navForm, sort_order: +e.target.value })} className="mt-1.5 w-24" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={navForm.is_active} onChange={e => setNavForm({ ...navForm, is_active: e.target.checked })} className="accent-primary" />
              Идэвхтэй
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setNavDialog(false)}>Болих</Button>
            <Button onClick={saveNavItem}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Strip Dialog */}
      <Dialog open={fsDialog} onOpenChange={setFsDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingFsIdx !== null ? 'Feature засах' : 'Шинэ feature'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div><Label className="text-xs">Икон</Label><Input value={fsForm.icon} onChange={e => setFsForm({ ...fsForm, icon: e.target.value })} className="mt-1.5 text-center text-lg" placeholder="◆" /></div>
              <div><Label className="text-xs">Гарчиг</Label><Input value={fsForm.title} onChange={e => setFsForm({ ...fsForm, title: e.target.value })} className="mt-1.5" placeholder="Хурдан хүргэлт" /></div>
            </div>
            <div><Label className="text-xs">Тайлбар</Label><Input value={fsForm.desc} onChange={e => setFsForm({ ...fsForm, desc: e.target.value })} className="mt-1.5" placeholder="₮50,000+ үнэгүй" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFsDialog(false)}>Болих</Button>
            <Button onClick={saveFsItem}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Link Dialog */}
      <Dialog open={qlDialog} onOpenChange={setQlDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingQlIdx !== null ? 'Quick link засах' : 'Шинэ quick link'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div><Label className="text-xs">Нэр</Label><Input value={qlForm.label} onChange={e => setQlForm({ ...qlForm, label: e.target.value })} className="mt-1.5" placeholder="Дэлгүүр" /></div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input value={qlForm.url} onChange={e => setQlForm({ ...qlForm, url: e.target.value })} className="mt-1.5 font-mono" placeholder="/shop" />
              <div className="mt-1.5"><PageSelector onSelect={url => setQlForm({ ...qlForm, url })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Икон</Label><div className="mt-1.5"><IconPicker value={qlForm.icon} onChange={icon => setQlForm({ ...qlForm, icon })} /></div></div>
              <div><Label className="text-xs">Өнгө</Label><div className="flex gap-2 mt-1.5">
                <input type="color" value={qlForm.color} onChange={e => setQlForm({ ...qlForm, color: e.target.value })} className="w-10 h-10 rounded border-none cursor-pointer" />
                <Input value={qlForm.color} onChange={e => setQlForm({ ...qlForm, color: e.target.value })} className="flex-1 font-mono" />
              </div></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setQlDialog(false)}>Болих</Button>
            <Button onClick={saveQlItem}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-item Dialog (for DROPDOWN items) */}
      <Dialog open={subDialog} onOpenChange={setSubDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingSubIdx !== null ? 'Item засах' : 'Шинэ dropdown item'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 mt-4">
            <div><Label className="text-xs">Нэр</Label><Input value={subForm.label} onChange={e => setSubForm({ ...subForm, label: e.target.value })} className="mt-1.5" placeholder="Үнийн санал" /></div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input value={subForm.url} onChange={e => setSubForm({ ...subForm, url: e.target.value })} className="mt-1.5 font-mono" placeholder="/quote" />
              <div className="mt-1.5"><PageSelector onSelect={url => setSubForm({ ...subForm, url })} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSubDialog(false)}>Болих</Button>
            <Button onClick={saveSubItem}><Save className="h-4 w-4 mr-1" />Хадгалах</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
