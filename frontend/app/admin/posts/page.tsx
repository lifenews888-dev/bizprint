'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, apiUpload } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, ExternalLink, Search,
  Newspaper, ImagePlus, ArrowLeft, Save, Clock, ChevronDown, Wand2, X,
} from 'lucide-react'

interface AdminPost {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  thumbnail?: string
  category?: string
  tags?: string[]
  author_name?: string
  is_published: boolean
  is_featured: boolean
  published_at?: string | null
  reading_minutes?: number | null
  seo_title?: string
  seo_description?: string
  view_count: number
  created_at: string
  updated_at: string
}

interface PostForm {
  title: string
  slug: string
  excerpt: string
  content: string
  thumbnail: string
  category: string
  tags: string
  author_name: string
  is_published: boolean
  is_featured: boolean
  seo_title: string
  seo_description: string
}

const emptyForm: PostForm = {
  title: '', slug: '', excerpt: '', content: '', thumbnail: '', category: '',
  tags: '', author_name: '', is_published: false, is_featured: false,
  seo_title: '', seo_description: '',
}

/** Санал болгох ангиллууд — админ өөрөө шинийг бичиж бас болно */
const SUGGESTED_CATEGORIES = [
  'Технологи', 'Зөвлөгөө', 'Материал', 'Дизайн', 'Үйлдвэрлэл', 'Компанийн мэдээ',
]

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Тодорхойгүй алдаа'

const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
const labelClass = 'mb-1.5 block text-xs font-semibold text-muted-foreground'

/** HTML агуулгаас тоймд тохирох энгийн текст гаргана */
const excerptFromContent = (html: string) => {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= 180) return text
  const cut = text.slice(0, 180)
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return (lastStop > 80 ? cut.slice(0, lastStop + 1) : `${cut.trimEnd()}...`).trim()
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [tab, setTab] = useState<'list' | 'edit'>('list')
  const [editing, setEditing] = useState<AdminPost | null>(null)
  const [form, setForm] = useState<PostForm>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [loaded, setLoaded] = useState(false)
  const loading = !loaded

  const load = useCallback(() =>
    apiFetch<AdminPost[]>('/posts/all')
      .then(res => setPosts(Array.isArray(res) ? res : []))
      .catch(err => { toast.error('Нийтлэлүүдийг уншиж чадсангүй: ' + errorMessage(err)); setPosts([]) })
      .finally(() => setLoaded(true)),
  [])

  useEffect(() => { void load() }, [load])

  const field = <K extends keyof PostForm>(key: K, value: PostForm[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter(p => p.is_published).length,
    drafts: posts.filter(p => !p.is_published).length,
    views: posts.reduce((sum, p) => sum + (p.view_count || 0), 0),
  }), [posts])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return posts.filter(p => {
      if (statusFilter === 'published' && !p.is_published) return false
      if (statusFilter === 'draft' && p.is_published) return false
      if (!q) return true
      return [p.title, p.category, p.excerpt, ...(p.tags || [])]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    })
  }, [posts, search, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setShowAdvanced(false)
    setTab('edit')
  }

  const openEdit = (post: AdminPost) => {
    setEditing(post)
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      thumbnail: post.thumbnail || '',
      category: post.category || '',
      tags: (post.tags || []).join(', '),
      author_name: post.author_name || '',
      is_published: post.is_published,
      is_featured: post.is_featured,
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
    })
    setShowAdvanced(false)
    setTab('edit')
  }

  const buildPayload = () => ({
    title: form.title.trim(),
    ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
    excerpt: form.excerpt.trim(),
    content: form.content,
    thumbnail: form.thumbnail.trim(),
    category: form.category.trim(),
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    author_name: form.author_name.trim(),
    is_published: form.is_published,
    is_featured: form.is_featured,
    seo_title: form.seo_title.trim(),
    seo_description: form.seo_description.trim(),
  })

  /** `publish` өгвөл тухайн төлвөөр хадгална (товч дээрээс шууд нийтлэх) */
  const save = async (publish?: boolean) => {
    if (!form.title.trim()) { toast.error('Гарчиг оруулна уу'); return }
    const willPublish = publish ?? form.is_published
    setSaving(true)
    try {
      const payload = { ...buildPayload(), is_published: willPublish }
      if (editing) {
        await apiFetch(`/posts/${editing.id}`, { method: 'PATCH', body: payload })
        toast.success(willPublish ? 'Нийтлэл шинэчлэгдлээ ✓' : 'Драфт хадгалагдлаа')
      } else {
        await apiFetch('/posts', { method: 'POST', body: payload })
        toast.success(willPublish ? 'Нийтлэл сайт дээр гарлаа ✓' : 'Драфт хадгалагдлаа')
      }
      await load()
      setTab('list')
    } catch (err) {
      toast.error('Хадгалж чадсангүй: ' + errorMessage(err))
    }
    setSaving(false)
  }

  const togglePublished = async (post: AdminPost) => {
    try {
      await apiFetch(`/posts/${post.id}`, { method: 'PATCH', body: { is_published: !post.is_published } })
      toast.success(post.is_published ? 'Драфт болголоо' : 'Нийтлэгдлээ ✓')
      await load()
    } catch (err) {
      toast.error('Төлөв сольж чадсангүй: ' + errorMessage(err))
    }
  }

  const toggleFeatured = async (post: AdminPost) => {
    try {
      await apiFetch(`/posts/${post.id}`, { method: 'PATCH', body: { is_featured: !post.is_featured } })
      toast.success(post.is_featured ? 'Онцлохоос хаслаа' : 'Нүүр хуудсанд онцлогдлоо ✓')
      await load()
    } catch (err) {
      toast.error('Онцлох тохиргоо солигдсонгүй: ' + errorMessage(err))
    }
  }

  const remove = async (post: AdminPost) => {
    if (!confirm(`"${post.title}" нийтлэлийг устгах уу? Үүнийг буцаах боломжгүй.`)) return
    try {
      await apiFetch(`/posts/${post.id}`, { method: 'DELETE' })
      toast.success('Нийтлэл устгагдлаа')
      await load()
    } catch (err) {
      toast.error('Устгаж чадсангүй: ' + errorMessage(err))
    }
  }

  /** Cloudinary руу хуулаад URL буцаана (засварлагч болон хавтас хоёрт нийтлэг) */
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload<{ url?: string; error?: string }>('/upload/media', fd)
      if (res?.url) return res.url
      toast.error('Upload алдаа: ' + (res?.error || 'URL буцаагдсангүй'))
    } catch (err) {
      toast.error('Upload алдаа: ' + errorMessage(err))
    }
    return null
  }

  const uploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    if (url) { field('thumbnail', url); toast.success('Зураг орлоо') }
    setUploading(false)
  }

  const fillExcerpt = () => {
    const text = excerptFromContent(form.content)
    if (!text) { toast.error('Эхлээд агуулга бичнэ үү'); return }
    field('excerpt', text.slice(0, 600))
    toast.success('Тойм бөглөгдлөө')
  }

  // ─── Хэсэг: засварлах ──────────────────────────────────────────────────────
  if (tab === 'edit') {
    return (
      <div className="p-5 sm:p-6">
        <AdminPageHeader
          title={editing ? 'Нийтлэл засах' : 'Шинэ нийтлэл'}
          description={editing ? `bizprint.mn/posts/${editing.slug}` : 'Гарчиг, агуулгаа бичээд нийтэлнэ'}
        >
          <Button variant="outline" size="sm" onClick={() => setTab('list')}>
            <ArrowLeft />Буцах
          </Button>
          <Button variant="outline" size="sm" onClick={() => save(false)} disabled={saving}>
            <Save />Драфт хадгалах
          </Button>
          <Button size="sm" onClick={() => save(true)} disabled={saving}>
            {saving ? 'Хадгалж байна...' : editing && editing.is_published ? 'Шинэчлэх' : 'Нийтлэх'}
          </Button>
        </AdminPageHeader>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Үндсэн талбарууд */}
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Гарчиг *</label>
              <Input
                value={form.title}
                onChange={e => field('title', e.target.value)}
                placeholder="Офсет ба дижитал хэвлэлийн ялгаа"
                className="h-11 text-base font-semibold"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={labelClass + ' mb-0'}>Товч тайлбар</label>
                <button
                  type="button"
                  onClick={fillExcerpt}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <Wand2 size={12} />Агуулгаас бөглөх
                </button>
              </div>
              <textarea
                value={form.excerpt}
                onChange={e => field('excerpt', e.target.value)}
                maxLength={600}
                placeholder="1-2 өгүүлбэрээр гол санааг бичнэ. Жагсаалт, нүүр хуудас, Google-ийн хайлтын үр дүнд харагдана."
                className={`${inputClass} min-h-[66px] resize-y`}
              />
            </div>

            <div>
              <label className={labelClass}>Агуулга</label>
              <RichTextEditor
                value={form.content}
                onChange={html => field('content', html)}
                onUploadImage={uploadImage}
                placeholder="Энд бичнэ үү. Текстээ сонгоод дээрх товчуудаар гарчиг, тод, жагсаалт болгоно."
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Бичсэн шигээ сайт дээр харагдана. Word-оос хуулж буулгахад формат автоматаар цэвэрлэгдэнэ.
              </p>
            </div>
          </div>

          {/* Хажуугийн тохиргоо */}
          <div className="space-y-4">
            <SidebarCard title="Хаана харагдах вэ">
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <li>• <strong className="text-foreground">Мэдээ хуудас</strong> — нийтэлсэн бүх нийтлэл</li>
                <li>• <strong className="text-foreground">Нүүр хуудас</strong> — зөвхөн онцолсон нийтлэлүүд</li>
                <li>• <strong className="text-foreground">Цэс ба footer</strong> — &laquo;Мэдээ&raquo; холбоос байнга байна</li>
              </ul>
              <ToggleRow
                label="Нүүр хуудсанд онцлох"
                hint="Нүүрэн дээрх блокод эхэлж гарна"
                checked={form.is_featured}
                onChange={v => field('is_featured', v)}
              />
            </SidebarCard>

            <SidebarCard title="Хавтасны зураг">
              {form.thumbnail ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.thumbnail}
                    alt=""
                    className="h-32 w-full rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => field('thumbnail', '')}
                    title="Зураг хасах"
                    className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-md bg-background/90 text-muted-foreground hover:text-destructive"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-3 py-5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <ImagePlus size={14} />
                  {uploading ? 'Хуулж байна...' : 'Зураг сонгох'}
                  <input type="file" accept="image/*" onChange={uploadThumbnail} className="hidden" disabled={uploading} />
                </label>
              )}
            </SidebarCard>

            <SidebarCard title="Ангилал & таг">
              <div>
                <label className={labelClass}>Ангилал</label>
                <Input
                  value={form.category}
                  onChange={e => field('category', e.target.value)}
                  list="post-categories"
                  placeholder="Технологи"
                />
                <datalist id="post-categories">
                  {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className={labelClass}>Таг (таслалаар)</label>
                <Input
                  value={form.tags}
                  onChange={e => field('tags', e.target.value)}
                  placeholder="офсет, цаас, CMYK"
                />
              </div>
              <div>
                <label className={labelClass}>Зохиогч</label>
                <Input
                  value={form.author_name}
                  onChange={e => field('author_name', e.target.value)}
                  placeholder="BizPrint редакц"
                />
              </div>
            </SidebarCard>

            {/* Ховор хэрэглэгддэг талбаруудыг нугалж нуусан */}
            <div className="rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setShowAdvanced(s => !s)}
                className="flex w-full items-center justify-between p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Нэмэлт тохиргоо
                <ChevronDown size={14} className={showAdvanced ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>

              {showAdvanced && (
                <div className="space-y-3 border-t border-border p-4">
                  <div>
                    <label className={labelClass}>Хаягийн төгсгөл (slug)</label>
                    <Input
                      value={form.slug}
                      onChange={e => field('slug', e.target.value)}
                      placeholder="хоосон бол гарчгаас автоматаар"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {editing
                        ? 'Солих нь тархсан хуучин линкүүдийг эвдэнэ.'
                        : 'Монгол гарчиг автоматаар латинчлагдана.'}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Google-д харагдах гарчиг</label>
                    <Input
                      value={form.seo_title}
                      onChange={e => field('seo_title', e.target.value)}
                      placeholder="Хоосон бол нийтлэлийн гарчиг"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Google-д харагдах тайлбар</label>
                    <textarea
                      value={form.seo_description}
                      onChange={e => field('seo_description', e.target.value)}
                      maxLength={400}
                      placeholder="Хоосон бол товч тайлбар хэрэглэгдэнэ"
                      className={`${inputClass} min-h-[64px] resize-y`}
                    />
                  </div>
                </div>
              )}
            </div>

            {editing && (
              <SidebarCard title="Статистик">
                <StatRow label="Үзсэн" value={String(editing.view_count)} />
                <StatRow label="Унших хугацаа" value={`${editing.reading_minutes || 1} мин`} />
                <StatRow
                  label="Нийтэлсэн"
                  value={editing.published_at
                    ? new Date(editing.published_at).toLocaleDateString('mn-MN')
                    : '—'}
                />
              </SidebarCard>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Хэсэг: жагсаалт ───────────────────────────────────────────────────────
  return (
    <div className="p-5 sm:p-6">
      <AdminPageHeader
        title="Мэдээ & Нийтлэл"
        description="Хэвлэлийн нийтлэлүүдийг бичих, нийтлэх, нүүр хуудсанд онцлох"
      >
        <Button variant="outline" size="sm" asChild>
          <a href="/posts" target="_blank" rel="noopener noreferrer">
            <ExternalLink />Сайт дээр харах
          </a>
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus />Шинэ нийтлэл
        </Button>
      </AdminPageHeader>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Бүгд" value={stats.total} />
        <StatCard label="Нийтлэгдсэн" value={stats.published} />
        <StatCard label="Драфт" value={stats.drafts} />
        <StatCard label="Нийт үзэлт" value={stats.views} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Гарчиг, ангилал, тагаар хайх..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {([
            ['all', 'Бүгд'],
            ['published', 'Нийтлэгдсэн'],
            ['draft', 'Драфт'],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              variant={statusFilter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <Newspaper size={30} className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">
            {posts.length === 0 ? 'Одоогоор нийтлэл байхгүй' : 'Хайлтад тохирох нийтлэл олдсонгүй'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length === 0
              ? 'Анхны нийтлэлээ бичээд нүүр хуудсанд харуулаарай.'
              : 'Хайлтын үг эсвэл төлвийн шүүлтүүрийг сольж үзээрэй.'}
          </p>
          {posts.length === 0 && (
            <Button className="mt-4" size="sm" onClick={openCreate}><Plus />Шинэ нийтлэл</Button>
          )}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map(post => (
            <div
              key={post.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center"
            >
              {post.thumbnail
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={post.thumbnail} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                : <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Newspaper size={16} className="text-muted-foreground" />
                  </div>}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{post.title}</span>
                  {post.is_featured && (
                    <Badge variant="secondary" className="gap-1">
                      <Star size={10} />Онцлох
                    </Badge>
                  )}
                  <Badge variant={post.is_published ? 'default' : 'outline'}>
                    {post.is_published ? 'Нийтлэгдсэн' : 'Драфт'}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {post.category && <span>{post.category}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Eye size={11} />{post.view_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />{post.reading_minutes || 1} мин
                  </span>
                  <span>
                    {new Date(post.published_at || post.created_at).toLocaleDateString('mn-MN')}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={post.is_featured ? 'Онцлохоос хасах' : 'Нүүр хуудсанд онцлох'}
                  onClick={() => toggleFeatured(post)}
                >
                  <Star className={post.is_featured ? 'fill-current text-primary' : ''} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={post.is_published ? 'Драфт болгох' : 'Нийтлэх'}
                  onClick={() => togglePublished(post)}
                >
                  {post.is_published ? <EyeOff /> : <Eye />}
                </Button>
                {post.is_published && (
                  <Button variant="ghost" size="icon-sm" title="Сайт дээр харах" asChild>
                    <a href={`/posts/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" title="Засах" onClick={() => openEdit(post)}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Устгах"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(post)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-bold">{value.toLocaleString('mn-MN')}</div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function ToggleRow({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-muted/40 p-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF6B00]"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </label>
  )
}
