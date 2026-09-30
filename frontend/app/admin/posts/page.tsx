'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, apiUpload } from '@/lib/api'
import { sanitizeHtml } from '@/lib/sanitize'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, ExternalLink, Search,
  Newspaper, ImagePlus, ArrowLeft, Save, FileText, Clock,
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
  Minus, Code,
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

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [tab, setTab] = useState<'list' | 'edit'>('list')
  const [editing, setEditing] = useState<AdminPost | null>(null)
  const [form, setForm] = useState<PostForm>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(false)
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
    setPreview(false)
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
    setPreview(false)
    setTab('edit')
  }

  /** Хоосон талбаруудыг явуулахгүй — backend дээр null биш хоосон тэмдэгт болж хуримтлахаас сэргийлнэ */
  const buildPayload = () => {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    return {
      title: form.title.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      excerpt: form.excerpt.trim(),
      content: form.content,
      thumbnail: form.thumbnail.trim(),
      category: form.category.trim(),
      tags,
      author_name: form.author_name.trim(),
      is_published: form.is_published,
      is_featured: form.is_featured,
      seo_title: form.seo_title.trim(),
      seo_description: form.seo_description.trim(),
    }
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('Гарчиг оруулна уу'); return }
    setSaving(true)
    try {
      const payload = buildPayload()
      if (editing) {
        await apiFetch(`/posts/${editing.id}`, { method: 'PATCH', body: payload })
        toast.success('Нийтлэл шинэчлэгдлээ ✓')
      } else {
        await apiFetch('/posts', { method: 'POST', body: payload })
        toast.success(form.is_published ? 'Нийтлэл нийтлэгдлээ ✓' : 'Драфт хадгалагдлаа ✓')
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
      await apiFetch(`/posts/${post.id}`, {
        method: 'PATCH',
        body: { is_published: !post.is_published },
      })
      toast.success(post.is_published ? 'Драфт болголоо' : 'Нийтлэгдлээ ✓')
      await load()
    } catch (err) {
      toast.error('Төлөв сольж чадсангүй: ' + errorMessage(err))
    }
  }

  const toggleFeatured = async (post: AdminPost) => {
    try {
      await apiFetch(`/posts/${post.id}`, {
        method: 'PATCH',
        body: { is_featured: !post.is_featured },
      })
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

  // ─── Агуулгын редактор ───────────────────────────────────────────────────
  const contentRef = useRef<HTMLTextAreaElement>(null)

  /**
   * Сонгосон текстийг таг-аар хүрээлнэ. Сонголт хоосон бол placeholder-ийг
   * оруулаад курсорыг шинэ агуулгын төгсгөлд тавина.
   */
  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const textarea = contentRef.current
    if (!textarea) return

    const { selectionStart: start, selectionEnd: end } = textarea
    const selected = form.content.slice(start, end) || placeholder
    const next = form.content.slice(0, start) + before + selected + after + form.content.slice(end)
    field('content', next)

    // React дахин render хийсний дараа курсорыг сэргээнэ
    requestAnimationFrame(() => {
      textarea.focus()
      const caret = start + before.length + selected.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  const insertAtCursor = (snippet: string) => {
    const textarea = contentRef.current
    if (!textarea) {
      field('content', form.content + snippet)
      return
    }
    const { selectionStart: start } = textarea
    field('content', form.content.slice(0, start) + snippet + form.content.slice(start))
    requestAnimationFrame(() => {
      textarea.focus()
      const caret = start + snippet.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  const insertLink = () => {
    const url = prompt('Линкийн URL:')
    if (!url) return
    wrapSelection(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>', 'линкийн текст')
  }

  /** Нийтлэлийн дунд зураг оруулах — upload хийгээд шууд <img> болгож тавина */
  const uploadContentImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload<{ url?: string; error?: string }>('/upload/media', fd)
      if (res?.url) {
        insertAtCursor(`\n<img src="${res.url}" alt="" />\n`)
        toast.success('Зураг агуулгад орлоо')
      } else {
        toast.error('Upload алдаа: ' + (res?.error || 'URL буцаагдсангүй'))
      }
    } catch (err) {
      toast.error('Upload алдаа: ' + errorMessage(err))
    }
    setUploading(false)
    e.target.value = ''
  }

  const uploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload<{ url?: string; error?: string }>('/upload/media', fd)
      if (res?.url) {
        field('thumbnail', res.url)
        toast.success('Зураг орлоо')
      } else {
        toast.error('Upload алдаа: ' + (res?.error || 'URL буцаагдсангүй'))
      }
    } catch (err) {
      toast.error('Upload алдаа: ' + errorMessage(err))
    }
    setUploading(false)
    e.target.value = ''
  }

  // ─── Хэсэг: засварлах ──────────────────────────────────────────────────────
  if (tab === 'edit') {
    return (
      <div className="p-5 sm:p-6">
        <AdminPageHeader
          title={editing ? 'Нийтлэл засах' : 'Шинэ нийтлэл'}
          description={editing ? `/posts/${editing.slug}` : 'Гарчиг, агуулга оруулаад нийтэлнэ'}
        >
          <Button variant="outline" size="sm" onClick={() => setTab('list')}>
            <ArrowLeft />Жагсаалт
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save />{saving ? 'Хадгалж байна...' : 'Хадгалах'}
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
              />
            </div>

            <div>
              <label className={labelClass}>Тойм (жагсаалт болон нүүр хуудсанд харагдана)</label>
              <textarea
                value={form.excerpt}
                onChange={e => field('excerpt', e.target.value)}
                maxLength={600}
                placeholder="1-2 өгүүлбэрээр нийтлэлийн гол санааг бичнэ..."
                className={`${inputClass} min-h-[72px] resize-y`}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{form.excerpt.length}/600</p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={labelClass + ' mb-0'}>Агуулга (HTML)</label>
                <Button variant="ghost" size="xs" onClick={() => setPreview(p => !p)}>
                  {preview ? <><FileText />Засах</> : <><Eye />Preview</>}
                </Button>
              </div>

              {preview ? (
                <div className="min-h-[360px] rounded-lg border border-input bg-background p-5">
                  {form.content
                    ? <div
                        className="post-content text-sm"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content) }}
                      />
                    : <p className="text-sm text-muted-foreground">Агуулга хоосон байна</p>}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-input">
                  <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 p-1.5">
                    <ToolbarButton title="Дэд гарчиг (H2)" onClick={() => wrapSelection('<h2>', '</h2>', 'Дэд гарчиг')}>
                      <Heading2 />
                    </ToolbarButton>
                    <ToolbarButton title="Дэд дэд гарчиг (H3)" onClick={() => wrapSelection('<h3>', '</h3>', 'Дэд гарчиг')}>
                      <Heading3 />
                    </ToolbarButton>
                    <ToolbarDivider />
                    <ToolbarButton title="Тод" onClick={() => wrapSelection('<strong>', '</strong>', 'тод текст')}>
                      <Bold />
                    </ToolbarButton>
                    <ToolbarButton title="Налуу" onClick={() => wrapSelection('<em>', '</em>', 'налуу текст')}>
                      <Italic />
                    </ToolbarButton>
                    <ToolbarDivider />
                    <ToolbarButton title="Цэгтэй жагсаалт" onClick={() => insertAtCursor('\n<ul>\n  <li>Санал 1</li>\n  <li>Санал 2</li>\n</ul>\n')}>
                      <List />
                    </ToolbarButton>
                    <ToolbarButton title="Дугаартай жагсаалт" onClick={() => insertAtCursor('\n<ol>\n  <li>Эхний алхам</li>\n  <li>Дараагийн алхам</li>\n</ol>\n')}>
                      <ListOrdered />
                    </ToolbarButton>
                    <ToolbarButton title="Хэсэг (paragraph)" onClick={() => wrapSelection('<p>', '</p>', 'Догол мөр')}>
                      <FileText />
                    </ToolbarButton>
                    <ToolbarDivider />
                    <ToolbarButton title="Линк" onClick={insertLink}>
                      <LinkIcon />
                    </ToolbarButton>
                    <ToolbarButton title="Иш татах" onClick={() => wrapSelection('<blockquote>', '</blockquote>', 'Иш татсан текст')}>
                      <Quote />
                    </ToolbarButton>
                    <ToolbarButton title="Код" onClick={() => wrapSelection('<code>', '</code>', 'код')}>
                      <Code />
                    </ToolbarButton>
                    <ToolbarButton title="Хуваах зураас" onClick={() => insertAtCursor('\n<hr />\n')}>
                      <Minus />
                    </ToolbarButton>
                    <ToolbarDivider />
                    <label
                      title="Зураг оруулах"
                      className="inline-flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-3.5"
                    >
                      <ImagePlus />
                      <input type="file" accept="image/*" onChange={uploadContentImage} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={form.content}
                    onChange={e => field('content', e.target.value)}
                    placeholder={'<h2>Дэд гарчиг</h2>\n<p>Нийтлэлийн эхний догол мөр...</p>\n<ul><li>Санал 1</li></ul>'}
                    className="w-full min-h-[360px] resize-y bg-background px-3 py-2.5 text-sm font-mono outline-none"
                  />
                </div>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                Зөвшөөрөгдөх: h2–h6, p, ul/ol, strong, em, a, img, blockquote, table, pre/code, hr.
                Script болон бусад тагийг сайт дээр харуулахаас өмнө автоматаар цэвэрлэнэ.
              </p>
            </div>
          </div>

          {/* Хажуугийн тохиргоо */}
          <div className="space-y-4">
            <SidebarCard title="Төлөв">
              <ToggleRow
                label="Нийтлэх"
                hint="Салхилуулахгүй бол зөвхөн админ харна"
                checked={form.is_published}
                onChange={v => field('is_published', v)}
              />
              <ToggleRow
                label="Нүүр хуудсанд онцлох"
                hint="Нүүрийн блок дээр эхэлж харагдана"
                checked={form.is_featured}
                onChange={v => field('is_featured', v)}
              />
            </SidebarCard>

            <SidebarCard title="Хавтасны зураг">
              {form.thumbnail && (
                <img
                  src={form.thumbnail}
                  alt=""
                  className="mb-2 h-32 w-full rounded-lg border border-border object-cover"
                />
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <ImagePlus size={14} />
                {uploading ? 'Хуулж байна...' : 'Зураг сонгох'}
                <input type="file" accept="image/*" onChange={uploadThumbnail} className="hidden" disabled={uploading} />
              </label>
              <Input
                value={form.thumbnail}
                onChange={e => field('thumbnail', e.target.value)}
                placeholder="эсвэл зургийн URL"
                className="mt-2"
              />
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

            <SidebarCard title="URL">
              <div>
                <label className={labelClass}>Slug</label>
                <Input
                  value={form.slug}
                  onChange={e => field('slug', e.target.value)}
                  placeholder="хоосон бол гарчгаас автоматаар"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {editing
                    ? 'Slug солих нь тархсан хуучин линкүүдийг эвдэнэ.'
                    : 'Монгол гарчиг автоматаар латинчлагдана.'}
                </p>
              </div>
            </SidebarCard>

            <SidebarCard title="SEO (сонголттой)">
              <div>
                <label className={labelClass}>SEO гарчиг</label>
                <Input
                  value={form.seo_title}
                  onChange={e => field('seo_title', e.target.value)}
                  placeholder="Хоосон бол нийтлэлийн гарчиг"
                />
              </div>
              <div>
                <label className={labelClass}>Meta description</label>
                <textarea
                  value={form.seo_description}
                  onChange={e => field('seo_description', e.target.value)}
                  maxLength={400}
                  className={`${inputClass} min-h-[64px] resize-y`}
                />
              </div>
            </SidebarCard>

            {editing && (
              <SidebarCard title="Статистик">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Үзсэн</span>
                  <span className="font-bold">{editing.view_count}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Унших хугацаа</span>
                  <span className="font-bold">{editing.reading_minutes || 1} мин</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Нийтэлсэн</span>
                  <span className="font-bold">
                    {editing.published_at
                      ? new Date(editing.published_at).toLocaleDateString('mn-MN')
                      : '—'}
                  </span>
                </div>
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
                  <span className="truncate font-mono opacity-70">/{post.slug}</span>
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

function ToolbarButton({
  title, onClick, children,
}: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-3.5"
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-border" />
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-bold">{value.toLocaleString('mn-MN')}</div>
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
    <label className="flex cursor-pointer items-start gap-2.5">
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
