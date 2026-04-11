export function saveUTM() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const utm = {
    source: params.get('utm_source') || '',
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
    content: params.get('utm_content') || '',
    term: params.get('utm_term') || '',
    saved_at: new Date().toISOString(),
  }
  if (utm.source) {
    sessionStorage.setItem('utm_params', JSON.stringify(utm))
  }
}

export function getUTM(): Record<string, string> | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem('utm_params')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}
