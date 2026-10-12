/**
 * TDB QR / OAuth configuration.
 *
 * SECURITY: There are deliberately NO hard-coded credential defaults here.
 * Every credential must come from the environment. When the required values
 * are missing the TDB QR integration is treated as "not configured" and the
 * payment flow fails closed (QR creation falls back to manual bank transfer,
 * status checks refuse to run) instead of silently talking to a gateway with
 * guessed credentials.
 *
 * Local development / tests: set TDB_SANDBOX=true (ignored when
 * NODE_ENV=production) to allow the public TDB sandbox *URLs* as defaults.
 * Sandbox credentials must still be provided explicitly via env vars.
 */

const TDB_SANDBOX_QR_BASE = 'https://qrservice.tdbmlabs.mn'
const TDB_SANDBOX_OAUTH_URL = 'https://api-sandbox.tdbmlabs.mn:8443/oauth2/token'

export interface TdbConfig {
  qrBase: string
  qrUser: string
  qrPass: string
  qrTerminal: string
  oauthUrl: string
  clientId: string
  clientSecret: string
  iban: string
  account: string
  accountName: string
  callbackUrl: string
  sandbox: boolean
}

function env(name: string, e: NodeJS.ProcessEnv): string {
  return (e[name] || '').trim()
}

export function isTdbSandbox(e: NodeJS.ProcessEnv = process.env): boolean {
  return e.NODE_ENV !== 'production' && env('TDB_SANDBOX', e).toLowerCase() === 'true'
}

export function loadTdbConfig(e: NodeJS.ProcessEnv = process.env): TdbConfig {
  const sandbox = isTdbSandbox(e)
  const backendUrl = env('BACKEND_URL', e).replace(/\/+$/, '')
  return {
    qrBase: env('TDB_QR_BASE', e) || (sandbox ? TDB_SANDBOX_QR_BASE : ''),
    qrUser: env('TDB_QR_USER', e),
    qrPass: env('TDB_QR_PASS', e),
    qrTerminal: env('TDB_QR_TERMINAL', e),
    oauthUrl: env('TDB_OAUTH_URL', e) || (sandbox ? TDB_SANDBOX_OAUTH_URL : ''),
    clientId: env('TDB_CLIENT_ID', e),
    clientSecret: env('TDB_CLIENT_SECRET', e),
    iban: env('TDB_BIZPRINT_IBAN', e),
    account: env('TDB_BIZPRINT_ACCOUNT', e),
    // Legal entity display name — not a secret.
    accountName: env('TDB_BIZPRINT_ACCOUNT_NAME', e) || 'ЮүЭмБи Верто ХХК',
    callbackUrl:
      env('PAYMENT_CALLBACK_URL', e) ||
      (backendUrl ? `${backendUrl}/api/payment/callback` : sandbox ? 'http://localhost:4000/api/payment/callback' : ''),
    sandbox,
  }
}

/** Returns the names (never values) of missing required TDB QR settings. */
export function missingTdbQrEnv(cfg: TdbConfig): string[] {
  const missing: string[] = []
  if (!cfg.qrBase) missing.push('TDB_QR_BASE')
  if (!cfg.qrUser) missing.push('TDB_QR_USER')
  if (!cfg.qrPass) missing.push('TDB_QR_PASS')
  if (!cfg.qrTerminal) missing.push('TDB_QR_TERMINAL')
  if (!cfg.account) missing.push('TDB_BIZPRINT_ACCOUNT')
  if (!cfg.callbackUrl) missing.push('PAYMENT_CALLBACK_URL (or BACKEND_URL)')
  return missing
}

/** Returns the names of missing OAuth settings (only needed for OAuth calls). */
export function missingTdbOAuthEnv(cfg: TdbConfig): string[] {
  const missing: string[] = []
  if (!cfg.oauthUrl) missing.push('TDB_OAUTH_URL')
  if (!cfg.clientId) missing.push('TDB_CLIENT_ID')
  if (!cfg.clientSecret) missing.push('TDB_CLIENT_SECRET')
  return missing
}
