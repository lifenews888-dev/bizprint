'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Minus, ImagePlus, Undo2, Redo2, Eraser, Code2, Type,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  /** Зураг upload хийгээд URL буцаана. Байхгүй бол зургийн товч харагдахгүй. */
  onUploadImage?: (file: File) => Promise<string | null>
  placeholder?: string
  minHeight?: number
}

/**
 * Энгийн визуал засварлагч.
 *
 * Хэрэглэгч HTML тааг огт харахгүй — бичээд товч дарж форматлана. Доор нь
 * HTML үүсэж, сайт дээр гарахаасаа өмнө sanitizeHtml-ээр цэвэрлэгдэнэ.
 *
 * contentEditable-ийг React-ээр удирдвал курсор үсэрдэг тул энэ нь
 * UNCONTROLLED: DOM-г зөвхөн гаднаас өөр утга ирэхэд л шинэчилнэ.
 *
 * execCommand нь албан ёсоор deprecated ч бүх browser дээр ажилладаг бөгөөд
 * нэмэлт хамаарал шаардахгүй — тиймээс үүнийг сонгов.
 */
export default function RichTextEditor({
  value, onChange, onUploadImage, placeholder, minHeight = 380,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastEmitted = useRef<string>(value)
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const [uploading, setUploading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!value)

  // Гаднаас утга солигдоход (өөр нийтлэл нээх, HTML горимоос буцах) DOM-г
  // шинэчилнэ. Өөрсдийн emit хийсэн утга бол хөндөхгүй — курсор хадгалагдана.
  useEffect(() => {
    if (mode !== 'visual') return
    const el = editorRef.current
    if (!el) return
    if (value !== lastEmitted.current) {
      el.innerHTML = value || ''
      lastEmitted.current = value
    }
    setIsEmpty(!el.textContent?.trim() && !el.querySelector('img'))
  }, [value, mode])

  const emit = () => {
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    lastEmitted.current = html
    setIsEmpty(!el.textContent?.trim() && !el.querySelector('img'))
    onChange(html)
  }

  /** Командыг сонголт дээр хэрэглээд фокусыг засварлагчид буцаана */
  const exec = (command: string, argument?: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    // styleWithCSS=false → <b>/<i> гарна, inline style биш.
    // Sanitizer нь style-г хэсэгчлэн зөвшөөрдөг ч семантик таг нь дээр.
    document.execCommand('styleWithCSS', false, 'false')
    document.execCommand(command, false, argument)
    emit()
  }

  const insertHtml = (html: string) => exec('insertHTML', html)

  const addLink = () => {
    const url = prompt('Линкийн URL:')
    if (!url) return
    const safe = /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}`
    exec('createLink', safe)
  }

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onUploadImage) return
    setUploading(true)
    try {
      const url = await onUploadImage(file)
      if (url) insertHtml(`<img src="${url}" alt="" />`)
    } finally {
      setUploading(false)
    }
  }

  /**
   * Word, вэб хуудаснаас буулгахад олон зуун мөр хэрэггүй таг ордог.
   * Энгийн текст болгож буулгаснаар агуулга цэвэрхэн үлдэнэ.
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    const html = text
      .split(/\n{2,}/)
      .map(block => `<p>${block.replace(/\n/g, '<br />').replace(/</g, '&lt;')}</p>`)
      .join('')
    insertHtml(html)
  }

  const Btn = ({
    title, onClick, disabled, children,
  }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={e => e.preventDefault()} // сонголт алдагдахаас сэргийлнэ
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  )

  const Divider = () => <span className="mx-1 h-5 w-px bg-border" />

  return (
    <div className="overflow-hidden rounded-lg border border-input">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 p-1.5">
        {mode === 'visual' ? (
          <>
            <Btn title="Энгийн догол мөр" onClick={() => exec('formatBlock', 'p')}><Type /></Btn>
            <Btn title="Гарчиг" onClick={() => exec('formatBlock', 'h2')}><Heading2 /></Btn>
            <Btn title="Дэд гарчиг" onClick={() => exec('formatBlock', 'h3')}><Heading3 /></Btn>
            <Divider />
            <Btn title="Тод" onClick={() => exec('bold')}><Bold /></Btn>
            <Btn title="Налуу" onClick={() => exec('italic')}><Italic /></Btn>
            <Divider />
            <Btn title="Цэгтэй жагсаалт" onClick={() => exec('insertUnorderedList')}><List /></Btn>
            <Btn title="Дугаартай жагсаалт" onClick={() => exec('insertOrderedList')}><ListOrdered /></Btn>
            <Btn title="Иш татах" onClick={() => exec('formatBlock', 'blockquote')}><Quote /></Btn>
            <Divider />
            <Btn title="Линк" onClick={addLink}><LinkIcon /></Btn>
            {onUploadImage && (
              <Btn title={uploading ? 'Хуулж байна...' : 'Зураг'} disabled={uploading} onClick={() => fileRef.current?.click()}>
                <ImagePlus />
              </Btn>
            )}
            <Btn title="Хуваах зураас" onClick={() => insertHtml('<hr />')}><Minus /></Btn>
            <Divider />
            <Btn title="Формат арилгах" onClick={() => exec('removeFormat')}><Eraser /></Btn>
            <Btn title="Буцаах" onClick={() => exec('undo')}><Undo2 /></Btn>
            <Btn title="Дахих" onClick={() => exec('redo')}><Redo2 /></Btn>
          </>
        ) : (
          <span className="px-2 text-xs text-muted-foreground">
            HTML-ийг шууд засаж байна
          </span>
        )}

        <button
          type="button"
          onClick={() => setMode(m => (m === 'visual' ? 'html' : 'visual'))}
          className="ml-auto inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Code2 size={13} />{mode === 'visual' ? 'HTML' : 'Визуал'}
        </button>
      </div>

      {mode === 'visual' ? (
        <div className="relative">
          {isEmpty && placeholder && (
            <div className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Нийтлэлийн агуулга"
            onInput={emit}
            onBlur={emit}
            onPaste={handlePaste}
            style={{ minHeight }}
            className="post-content w-full bg-background px-4 py-3 text-sm leading-relaxed outline-none"
          />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ minHeight }}
          className="w-full resize-y bg-background px-3 py-2.5 font-mono text-sm outline-none"
        />
      )}

      {onUploadImage && (
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
      )}
    </div>
  )
}
