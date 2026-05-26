'use client'

import { useEffect } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

/**
 * Renders a third-party chatbot widget by injecting the embed <script> tag
 * configured via /admin/chatbot. The admin pastes raw HTML (e.g. a
 * `<script src="https://yria.mn/widget.js" data-business-id="..." defer>`
 * snippet), we parse it and append a real <script> node to <head>.
 *
 * Hidden on /admin/* — admins use the staff chat widget, not the customer bot.
 */
export default function ChatbotEmbed() {
  const { settings } = useSiteSettings()
  const code: string = settings?.chatbot_embed_code || ''

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!code.trim()) return
    // Don't load the customer bot on admin pages
    if (window.location.pathname.startsWith('/admin')) return

    const MARK = 'data-chatbot-embed'
    // Strip any previously-injected chatbot scripts (e.g. settings hot-reload)
    document.querySelectorAll(`script[${MARK}]`).forEach(el => el.remove())

    const parsed = parseEmbed(code)
    if (!parsed) return

    const script = document.createElement('script')
    script.setAttribute(MARK, '1')
    if (parsed.src) script.src = parsed.src
    if (parsed.async) script.async = true
    if (parsed.defer) script.defer = true
    for (const [k, v] of Object.entries(parsed.dataset)) {
      script.dataset[k] = v
    }
    if (parsed.inline) script.text = parsed.inline
    document.head.appendChild(script)

    return () => {
      document.querySelectorAll(`script[${MARK}]`).forEach(el => el.remove())
    }
  }, [code])

  return null
}

interface ParsedEmbed {
  src: string | null
  defer: boolean
  async: boolean
  dataset: Record<string, string>
  inline: string | null
}

/** Pull src / defer / async / data-* out of a `<script ...>` HTML string. */
function parseEmbed(raw: string): ParsedEmbed | null {
  try {
    const tpl = document.createElement('template')
    tpl.innerHTML = raw.trim()
    const tag = tpl.content.querySelector('script')
    if (!tag) return null

    const dataset: Record<string, string> = {}
    for (const attr of Array.from(tag.attributes)) {
      if (attr.name.startsWith('data-')) {
        const key = attr.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        dataset[key] = attr.value
      }
    }
    return {
      src: tag.getAttribute('src'),
      defer: tag.hasAttribute('defer'),
      async: tag.hasAttribute('async'),
      dataset,
      inline: tag.src ? null : tag.textContent,
    }
  } catch {
    return null
  }
}
