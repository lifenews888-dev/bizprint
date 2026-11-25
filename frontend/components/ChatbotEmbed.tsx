'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

/**
 * Гадны чатботыг /admin/chatbot-д тавьсан embed кодоор харуулна.
 *
 * yria.mn: түүний widget.js нь `Content-Type: text/html` + `nosniff`-тэй ирдэг тул
 * хөтөч скриптийг ажиллуулахгүй (товч огт гарахгүй байсан). Тэр скрипт зөвхөн
 * `https://yria.mn/widget/<business-id>` iframe нээдэг тул бид товч, цонхыг өөрсдөө
 * зурж iframe-ийг шууд ачаална. Бусад үйлчилгээний кодыг хуучин аргаар script болгон оруулна.
 *
 * `window.dispatchEvent(new Event('bizprint:open-chat'))` — сайтын аль ч хэсгээс чатыг нээнэ.
 * /admin/* дээр харуулахгүй.
 */
export default function ChatbotEmbed() {
  const { settings } = useSiteSettings()
  const code: string = settings?.chatbot_embed_code || ''
  // Зөвхөн хөтөч дээр задлана (SSR-тэй hydration зөрөхгүй)
  const isClient = useSyncExternalStore(noop, () => true, () => false)
  const parsed = useMemo<ParsedEmbed | null>(() => {
    if (!isClient || !code.trim() || window.location.pathname.startsWith('/admin')) return null
    return parseEmbed(code)
  }, [isClient, code])

  const yria = parsed ? yriaTarget(parsed) : null

  useEffect(() => {
    if (!parsed || yria) return
    const MARK = 'data-chatbot-embed'
    document.querySelectorAll(`script[${MARK}]`).forEach(el => el.remove())
    const script = document.createElement('script')
    script.setAttribute(MARK, '1')
    if (parsed.src) script.src = parsed.src
    if (parsed.async) script.async = true
    if (parsed.defer) script.defer = true
    for (const [k, v] of Object.entries(parsed.attrs)) script.setAttribute(k, v)
    if (parsed.inline) script.text = parsed.inline
    document.head.appendChild(script)
    return () => { document.querySelectorAll(`script[${MARK}]`).forEach(el => el.remove()) }
  }, [parsed, yria])

  if (!yria) return null
  return <YriaChat url={yria.url} />
}

function YriaChat({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false) // iframe-ийг анх нээх үед л ачаална

  useEffect(() => {
    const w = window as unknown as { __bizprintChat?: boolean }
    w.__bizprintChat = true
    const onOpen = () => { setLoaded(true); setOpen(true) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('bizprint:open-chat', onOpen)
    window.addEventListener('keydown', onKey)
    return () => { w.__bizprintChat = false; window.removeEventListener('bizprint:open-chat', onOpen); window.removeEventListener('keydown', onKey) }
  }, [])

  const toggle = () => { setLoaded(true); setOpen(o => !o) }

  return (
    <>
      <div
        role="dialog"
        aria-label="BizPrint чат"
        aria-hidden={!open}
        className={`fixed bottom-[160px] right-4 z-[4000] md:bottom-[92px] flex h-[min(600px,calc(100dvh-190px))] md:h-[min(600px,calc(100dvh-120px))] w-[min(380px,calc(100vw-32px))] origin-bottom-right flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(17,24,39,0.28)] ring-1 ring-black/5 transition-all duration-200 sm:right-6 ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#FF6B00] to-[#8B5CF6] px-4 py-3 text-white">
          <img src="/brand/bizprint-mark-256.png" alt="" width={36} height={36} className="h-9 w-9 rounded-[10px] ring-2 ring-white/40" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-tight">BizPrint туслах</p>
            <p className="flex items-center gap-1.5 text-[12px] text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Онлайн · үнэ, захиалга, хүргэлт
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Хаах"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[18px] leading-none hover:bg-white/25">×</button>
        </div>
        {loaded && (
          <iframe src={url} title="BizPrint чат" allow="clipboard-write" className="h-full w-full flex-1 border-0" />
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Чат хаах' : 'Чат нээх'}
        aria-expanded={open}
        className="group fixed bottom-[88px] right-4 z-[4001] md:bottom-5 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#8B5CF6] text-white shadow-[0_14px_34px_rgba(139,92,246,0.40)] transition-transform hover:scale-105 sm:right-6"
      >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-[#FF6B00]/30 [animation-duration:2.6s]" />}
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="relative"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.12 1.02 4.06 2.72 5.5L4 21l4.75-1.98c1.02.3 2.11.48 3.25.48 5.52 0 10-3.58 10-8s-4.48-8-10-8z" /></svg>
        )}
      </button>
    </>
  )
}

const noop = () => () => {}

interface ParsedEmbed {
  src: string | null
  defer: boolean
  async: boolean
  attrs: Record<string, string>
  inline: string | null
}

/** yria.mn/widget.js → https://yria.mn/widget/<uuid>[?color=] */
function yriaTarget(p: ParsedEmbed): { url: string } | null {
  if (!p.src) return null
  let u: URL
  try { u = new URL(p.src) } catch { return null }
  if (!/(^|\.)yria\.mn$/i.test(u.hostname) || !u.pathname.endsWith('/widget.js')) return null
  const id = String(p.attrs['data-business-id'] || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (!id) return null
  const color = p.attrs['data-color']
  return { url: `${u.origin}/widget/${id[0].toLowerCase()}${color ? `?color=${encodeURIComponent(color)}` : ''}` }
}

/** `<script ...>` HTML мөрөөс src / defer / async / data-* авна. */
function parseEmbed(raw: string): ParsedEmbed | null {
  try {
    const tpl = document.createElement('template')
    tpl.innerHTML = raw.trim()
    const tag = tpl.content.querySelector('script')
    if (!tag) return null
    const attrs: Record<string, string> = {}
    for (const attr of Array.from(tag.attributes)) {
      if (attr.name.startsWith('data-')) attrs[attr.name] = attr.value
    }
    return {
      src: tag.getAttribute('src'),
      defer: tag.hasAttribute('defer'),
      async: tag.hasAttribute('async'),
      attrs,
      inline: tag.getAttribute('src') ? null : tag.textContent,
    }
  } catch {
    return null
  }
}
