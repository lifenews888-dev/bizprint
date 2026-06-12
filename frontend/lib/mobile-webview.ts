type MobileWebViewMessage = {
  type: string
  path?: string
}

interface ReactNativeWebViewBridge {
  postMessage(message: string): void
}

type MobileWindow = Window & typeof globalThis & {
  ReactNativeWebView?: ReactNativeWebViewBridge
}

function getBridge() {
  if (typeof window === 'undefined') return null
  return (window as MobileWindow).ReactNativeWebView || null
}

export function postMobileMessage(message: MobileWebViewMessage) {
  const bridge = getBridge()
  if (!bridge) return false
  bridge.postMessage(JSON.stringify(message))
  return true
}

export function navigateMobile(path: string) {
  if (postMobileMessage({ type: 'NAVIGATE_WEB', path })) return
  window.location.href = path
}
