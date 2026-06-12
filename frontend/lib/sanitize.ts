import DOMPurify from 'dompurify'

// Shared HTML sanitizers for any CMS / vendor / admin-authored content that
// reaches `dangerouslySetInnerHTML`. Centralizing this keeps every injection
// point on the same allowlist instead of each page trusting raw HTML.
//
// DOMPurify needs a DOM, so it only runs in the browser. All pages here are
// client components that load their content via apiFetch after mount, so the
// server render has no content to sanitize and there is no hydration mismatch.

const RICH_TEXT_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'blockquote', 'span', 'div',
  'table', 'tr', 'td', 'th', 'thead', 'tbody', 'hr', 'pre', 'code',
]
const RICH_TEXT_ATTR = ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'title']

/** Sanitize rich text (product descriptions, CMS page bodies, features). */
export function sanitizeHtml(html?: string | null): string {
  if (!html || typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_TEXT_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ATTR,
  })
}

/**
 * Sanitize map / video embed snippets. Allows <iframe> (so a CMS editor can
 * paste a Google Maps / YouTube embed) but locks the attribute set so no
 * script-bearing markup or event handlers survive.
 */
export function sanitizeEmbed(html?: string | null): string {
  if (!html || typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['iframe', 'div', 'p', 'br', 'a', 'span'],
    ALLOWED_ATTR: [
      'src', 'width', 'height', 'style', 'class', 'allow', 'allowfullscreen',
      'loading', 'referrerpolicy', 'frameborder', 'title', 'href', 'target', 'rel',
    ],
    ADD_ATTR: ['allowfullscreen'],
  })
}
