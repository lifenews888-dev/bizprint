// ─── System Health & Monitoring Types ───────────────

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  uptime_seconds: number
  version: string
  timestamp: string
  services: ServiceStatus[]
  resources: ResourceMetrics
}

export interface ServiceStatus {
  name: string                  // 'api', 'database', 'redis', 'socket', 'storage'
  status: 'up' | 'degraded' | 'down'
  latency_ms: number
  last_check: string
  message?: string
}

export interface ResourceMetrics {
  cpu_percent: number
  memory_used_mb: number
  memory_total_mb: number
  disk_used_gb: number
  disk_total_gb: number
  active_connections: number
  requests_per_minute: number
}

// ─── Error Logs ─────────────────────────────────────

export interface ErrorLog {
  id: string
  level: 'error' | 'warn' | 'fatal'
  message: string
  stack?: string
  endpoint?: string
  method?: string
  status_code?: number
  user_id?: string
  user_agent?: string
  ip?: string
  file_path?: string
  line_number?: number
  created_at: string
  count?: number             // aggregated occurrence count
  resolved?: boolean
}

// ─── Metrics / Analytics ────────────────────────────

export interface Metric {
  name: string
  value: number
  unit: string               // 'count', 'ms', 'percent', 'bytes', '₮'
  change_percent?: number    // vs previous period
  trend: 'up' | 'down' | 'stable'
  period: string             // 'today', 'week', 'month'
}

export interface TimeSeriesPoint {
  timestamp: string
  value: number
}

export interface TimeSeries {
  name: string
  unit: string
  points: TimeSeriesPoint[]
}

// ─── Admin User Management ──────────────────────────

export interface AdminUserEntry {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  is_banned: boolean
  created_at: string
  last_login?: string
  order_count?: number
  total_spent?: number
}

// ─── Global Config ──────────────────────────────────

export interface GlobalConfigEntry {
  key: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean' | 'json'
  label: string
  description?: string
  category: string           // 'pricing', 'delivery', 'system', 'feature'
  updated_at: string
  updated_by?: string
}
