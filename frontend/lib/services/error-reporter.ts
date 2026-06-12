/**
 * Client-side Error Reporter — sends errors to /errors/report endpoint.
 * Use in any BizPrint app: web, user_app, driver_app, vendor_app.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type ErrorSource = 'web' | 'user_app' | 'driver_app' | 'vendor_app'

interface ErrorReport {
  source: ErrorSource
  message: string
  error_code?: string
  stack_trace?: string
  user_id?: string
  order_id?: string
  endpoint?: string
  http_method?: string
  http_status?: number
  severity?: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, unknown>
}

/** Send error report to backend (fire-and-forget) */
export function reportError(error: ErrorReport) {
  // Add device/browser info
  const payload = {
    ...error,
    app_version: '1.0.0',
    browser: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : undefined,
    os: typeof navigator !== 'undefined' ? navigator.platform : undefined,
    device_info: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : undefined,
  }

  fetch(`${API_URL}/api/errors/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {}) // Silent fail — don't break the app
}

/** Report API fetch errors automatically */
export function reportApiError(path: string, method: string, status: number, message: string, userId?: string) {
  reportError({
    source: 'web',
    message: `API Error: ${method} ${path} → ${status}`,
    endpoint: path,
    http_method: method,
    http_status: status,
    user_id: userId,
    severity: status >= 500 ? 'high' : 'medium',
    metadata: { response_message: message },
  })
}

/** Global error handler — attach to window */
export function setupGlobalErrorHandler(source: ErrorSource = 'web') {
  if (typeof window === 'undefined') return

  // Unhandled errors
  window.addEventListener('error', (event) => {
    reportError({
      source,
      message: event.message || 'Unhandled error',
      stack_trace: event.error?.stack,
      severity: 'high',
      metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    })
  })

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      source,
      message: `Unhandled rejection: ${event.reason?.message || String(event.reason)}`,
      stack_trace: event.reason?.stack,
      severity: 'medium',
    })
  })
}
