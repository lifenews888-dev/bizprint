/**
 * Server-side HTML cleanup for admin-authored post bodies.
 * lib/sanitize.ts (DOMPurify) returns '' outside the browser, so the
 * server-rendered /posts/[slug] page showed no article body at all.
 * Post content is written only by admins; this strips the risky parts.
 */
export function sanitizeHtmlServer(html?: string | null): string {
  if (!html) return ''
  return html
    .replace(/<(script|style|iframe|object|embed|form)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\2/gi, ' $1="#"')
}

export interface FaqItem { question: string; answer: string }

const text = (s: string) =>
  s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

/** FAQ section: <h2>..FAQ heading..</h2> then <h3>Q</h3><p>A</p> pairs. */
export function extractFaq(html?: string | null): FaqItem[] {
  if (!html) return []
  const m = html.match(/<h2[^>]*>[^<]*(\u0422\u04af\u0433\u044d\u044d\u043c\u044d\u043b \u0430\u0441\u0443\u0443\u043b\u0442|FAQ)[^<]*<\/h2>([\s\S]*?)(?=<h2[\s>]|<div class="cta-box"|$)/i)
  if (!m) return []
  const items: FaqItem[] = []
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[\s>]|$)/gi
  let x: RegExpExecArray | null
  while ((x = re.exec(m[2]))) {
    const q = text(x[1]), a = text(x[2])
    if (q && a) items.push({ question: q, answer: a })
  }
  return items.slice(0, 12)
}
