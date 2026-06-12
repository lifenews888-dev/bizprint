'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

/* ═══════════════════════════════════════════
   SETTINGS SCHEMA — typed, grouped, validated
   ═══════════════════════════════════════════ */
interface SettingDef {
  key: string; label: string; type: 'number' | 'boolean' | 'string' | 'select' | 'json'
  desc?: string; default_value: SettingValue; options?: string[]; min?: number; max?: number; unit?: string; sensitive?: boolean
}
interface SettingGroup { key: string; label: string; icon: string; color: string; settings: SettingDef[] }
type SettingValue = string | number | boolean
interface SettingRecord { key: string; value: SettingValue }

const SETTING_GROUPS: SettingGroup[] = [
  { key: 'pricing', label: 'Үнэ & Татвар', icon: '💰', color: '#FF6B00', settings: [
    { key: 'tax_rate', label: 'НӨАТ хувь', type: 'number', default_value: 10, unit: '%', min: 0, max: 30, desc: 'Нэмэгдсэн өртгийн албан татвар' },
    { key: 'platform_fee', label: 'Платформ хураамж', type: 'number', default_value: 5, unit: '%', min: 0, max: 20, desc: 'BizPrint-ийн нэмэлт хураамж' },
    { key: 'default_margin_rate', label: 'Default margin', type: 'number', default_value: 25, unit: '%', min: 5, max: 100, desc: 'Vendor cost дээрх маржин' },
    { key: 'discount_limit', label: 'Хямдралын дээд хэмжээ', type: 'number', default_value: 30, unit: '%', min: 0, max: 80 },
    { key: 'min_order_amount', label: 'Хамгийн бага захиалга', type: 'number', default_value: 5000, unit: '₮', min: 0 },
  ]},
  { key: 'commission', label: 'Шимтгэл', icon: '🏦', color: '#8B5CF6', settings: [
    { key: 'vendor_commission_rate', label: 'Vendor шимтгэл', type: 'number', default_value: 15, unit: '%', min: 0, max: 50, desc: 'Vendor-аас авах шимтгэлийн хувь' },
    { key: 'designer_commission_rate', label: 'Дизайнер шимтгэл', type: 'number', default_value: 10, unit: '%', min: 0, max: 50, desc: 'Дизайнерт өгөх хувь' },
    { key: 'sales_commission_rate', label: 'Борлуулалтын шимтгэл', type: 'number', default_value: 10, unit: '%', min: 0, max: 30 },
    { key: 'referral_commission', label: 'Referral шимтгэл', type: 'number', default_value: 5, unit: '%', min: 0, max: 20 },
  ]},
  { key: 'orders', label: 'Захиалга', icon: '📋', color: '#10B981', settings: [
    { key: 'auto_assign_vendor', label: 'Vendor автомат хуваарилалт', type: 'boolean', default_value: true, desc: 'Захиалга CONFIRMED болоход vendor автоматаар сонгогдох' },
    { key: 'auto_complete_hours', label: 'Автомат дуусгах хугацаа', type: 'number', default_value: 72, unit: 'цаг', min: 12, max: 720, desc: 'DELIVERED-ээс хойш автоматаар COMPLETED болох' },
    { key: 'allow_revision', label: 'Дизайн засвар зөвшөөрөх', type: 'boolean', default_value: true },
    { key: 'max_revision_count', label: 'Засварын дээд тоо', type: 'number', default_value: 5, min: 1, max: 20 },
    { key: 'require_file_before_production', label: 'Файлгүй үйлдвэрлэл хориглох', type: 'boolean', default_value: true },
  ]},
  { key: 'delivery', label: 'Хүргэлт', icon: '🚚', color: '#3B82F6', settings: [
    { key: 'tracking_enabled', label: 'Tracking идэвхтэй', type: 'boolean', default_value: true },
    { key: 'auto_dispatch', label: 'Автомат илгээх', type: 'boolean', default_value: false, desc: 'Үйлдвэрлэл дууссаны дараа автомат хүргэлтэд өгөх' },
    { key: 'delivery_timeout_hours', label: 'Хүргэлтийн хугацаа', type: 'number', default_value: 48, unit: 'цаг', min: 1, max: 168 },
    { key: 'default_delivery_cost', label: 'Хүргэлтийн зардал', type: 'number', default_value: 5000, unit: '₮', min: 0 },
    { key: 'free_delivery_threshold', label: 'Үнэгүй хүргэлтийн босго', type: 'number', default_value: 50000, unit: '₮', min: 0, desc: 'Энэ дүнгээс дээш захиалгад хүргэлт үнэгүй' },
  ]},
  { key: 'files', label: 'Файл', icon: '📁', color: '#F59E0B', settings: [
    { key: 'max_upload_size_mb', label: 'Файлын дээд хэмжээ', type: 'number', default_value: 100, unit: 'MB', min: 1, max: 500 },
    { key: 'allowed_file_types', label: 'Зөвшөөрөх файлын төрөл', type: 'string', default_value: 'pdf,ai,eps,psd,jpg,png,zip', desc: 'Таслалаар тусгаарлана' },
    { key: 'auto_pdf_inspect', label: 'PDF автомат шалгалт', type: 'boolean', default_value: true, desc: 'AI PDF Inspector ажиллуулах' },
  ]},
  { key: 'payment', label: 'Төлбөр', icon: '💳', color: '#EC4899', settings: [
    { key: 'currency', label: 'Валют', type: 'select', default_value: 'MNT', options: ['MNT', 'USD'] },
    { key: 'invoice_prefix', label: 'Нэхэмжлэхийн prefix', type: 'string', default_value: 'BP-' },
    { key: 'payment_timeout_minutes', label: 'Төлбөрийн хугацаа', type: 'number', default_value: 30, unit: 'мин', min: 5, max: 1440 },
    { key: 'escrow_release_hours', label: 'Escrow чөлөөлөх хугацаа', type: 'number', default_value: 48, unit: 'цаг', min: 24, max: 168, desc: 'DELIVERED-ээс хойш vendor-д мөнгө шилжүүлэх' },
  ]},
  { key: 'features', label: 'Feature Flags', icon: '🚀', color: '#06B6D4', settings: [
    { key: 'enable_designer_marketplace', label: 'Дизайнер marketplace', type: 'boolean', default_value: true, desc: 'Дизайнеруудын загвар зарах боломж' },
    { key: 'enable_auto_pricing', label: 'AI автомат үнэ', type: 'boolean', default_value: true, desc: 'Smart Quote AI системийг идэвхжүүлэх' },
    { key: 'enable_zoom', label: 'Zoom интеграц', type: 'boolean', default_value: true, desc: 'Дизайн Zoom уулзалтын боломж' },
    { key: 'enable_chat', label: 'Чат систем', type: 'boolean', default_value: true },
    { key: 'enable_wallet', label: 'Хэтэвч систем', type: 'boolean', default_value: true },
    { key: 'enable_referral', label: 'Referral систем', type: 'boolean', default_value: false },
    { key: 'maintenance_mode', label: '🔧 Maintenance горим', type: 'boolean', default_value: false, desc: 'Идэвхжүүлбэл сайт хэрэглэгчдэд хаагдана' },
  ]},
  { key: 'notifications', label: 'Мэдэгдэл', icon: '🔔', color: '#F97316', settings: [
    { key: 'email_notifications', label: 'Имэйл мэдэгдэл', type: 'boolean', default_value: true },
    { key: 'sms_notifications', label: 'SMS мэдэгдэл', type: 'boolean', default_value: false },
    { key: 'admin_email', label: 'Админ имэйл', type: 'string', default_value: 'admin@bizprint.mn', desc: 'Системийн мэдэгдэл авах имэйл' },
    { key: 'factory_fallback_email', label: 'Үйлдвэр fallback имэйл', type: 'string', default_value: '', desc: 'Үйлдвэрийн имэйл байхгүй үед' },
  ]},
]

/* ═══ MAIN PAGE ═══ */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeGroup, setActiveGroup] = useState('pricing')
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)

  // Load all settings from API
  useEffect(() => {
    apiFetch<SettingRecord[]>('/settings').then(d => {
      const map: Record<string, SettingValue> = {}
      if (Array.isArray(d)) d.forEach(s => { map[s.key] = s.value })
      // Fill defaults for missing keys
      SETTING_GROUPS.forEach(g => g.settings.forEach(s => {
        if (map[s.key] === undefined) map[s.key] = s.default_value
        // Parse booleans
        if (s.type === 'boolean' && typeof map[s.key] === 'string') {
          map[s.key] = map[s.key] === 'true'
        }
        // Parse numbers
        if (s.type === 'number' && typeof map[s.key] === 'string') {
          map[s.key] = Number(map[s.key])
        }
      }))
      setSettings(map)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function updateSetting(key: string, value: SettingValue) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setChanged(prev => new Set(prev).add(key))
  }

  async function saveAll() {
    setSaving(true)
    try {
      const promises = Array.from(changed).map(key =>
        apiFetch('/settings', { method: 'POST', body: JSON.stringify({ key, value: String(settings[key]), description: '' }), headers: { 'Content-Type': 'application/json' } }).catch(() => {})
      )
      await Promise.all(promises)
      setChanged(new Set())
      setToast('✅ Тохиргоо хадгалагдлаа')
      setTimeout(() => setToast(null), 3000)
    } finally { setSaving(false) }
  }

  const activeGroupDef = SETTING_GROUPS.find(g => g.key === activeGroup)!

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-48" /><div className="h-64 bg-gray-100 rounded-xl" /></div></div>

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-xl z-[9999] bg-emerald-50 text-emerald-700 border border-emerald-200">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] tracking-tight">Системийн тохиргоо</h1>
          <p className="text-sm text-[#888] mt-1">BizPrint платформын удирдлагын самбар</p>
        </div>
        {changed.size > 0 && (
          <button onClick={saveAll} disabled={saving}
            className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2">
            {saving ? '⏳ Хадгалж байна...' : `💾 Хадгалах (${changed.size})`}
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar — group navigation */}
        <div className="w-[220px] flex-shrink-0 space-y-1">
          {SETTING_GROUPS.map(g => {
            const isActive = activeGroup === g.key
            const hasChanges = g.settings.some(s => changed.has(s.key))
            return (
              <button key={g.key} onClick={() => setActiveGroup(g.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive ? 'bg-white shadow-sm border border-[#E5E7EB]' : 'hover:bg-[#F8F8F8]'
                }`}>
                <span className="text-lg">{g.icon}</span>
                <span className={`text-sm flex-1 ${isActive ? 'font-bold text-[#111]' : 'font-medium text-[#555]'}`}>{g.label}</span>
                {hasChanges && <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            {/* Group header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-3" style={{ background: activeGroupDef.color + '08' }}>
              <span className="text-2xl">{activeGroupDef.icon}</span>
              <div>
                <h2 className="text-base font-bold text-[#111]">{activeGroupDef.label}</h2>
                <p className="text-xs text-[#888]">{activeGroupDef.settings.length} тохиргоо</p>
              </div>
            </div>

            {/* Settings list */}
            <div className="divide-y divide-[#F3F4F6]">
              {activeGroupDef.settings.map(s => {
                const value = settings[s.key] ?? s.default_value
                const isChanged = changed.has(s.key)
                const isDefault = value === s.default_value || String(value) === String(s.default_value)

                return (
                  <div key={s.key} className={`px-6 py-4 flex items-center justify-between gap-6 ${isChanged ? 'bg-orange-50/30' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#111]">{s.label}</span>
                        {isChanged && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />}
                        {!isDefault && <span className="text-[9px] text-[#999] bg-[#F3F4F6] px-1.5 py-0.5 rounded">өөрчилсөн</span>}
                      </div>
                      {s.desc && <p className="text-[11px] text-[#888] mt-0.5">{s.desc}</p>}
                      <span className="text-[10px] text-[#CCC] font-mono">{s.key}</span>
                    </div>

                    <div className="flex-shrink-0 w-[200px] flex items-center justify-end gap-2">
                      {/* Boolean toggle */}
                      {s.type === 'boolean' && (
                        <button onClick={() => updateSetting(s.key, !Boolean(value))}
                          className={`w-12 h-7 rounded-full transition-colors flex-shrink-0 relative ${Boolean(value) ? 'bg-[#FF6B00]' : 'bg-[#D1D5DB]'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${Boolean(value) ? 'left-6' : 'left-1'}`} />
                        </button>
                      )}

                      {/* Number input */}
                      {s.type === 'number' && (
                        <div className="flex items-center gap-1.5">
                          <input type="number" value={Number(value)} min={s.min} max={s.max}
                            onChange={e => updateSetting(s.key, Number(e.target.value))}
                            className="w-24 px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg text-sm text-right outline-none focus:border-[#FF6B00] transition-colors" />
                          {s.unit && <span className="text-xs text-[#888] font-medium">{s.unit}</span>}
                        </div>
                      )}

                      {/* String input */}
                      {s.type === 'string' && (
                        <input value={String(value)} onChange={e => updateSetting(s.key, e.target.value)}
                          className="w-48 px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors"
                          type={s.sensitive ? 'password' : 'text'} />
                      )}

                      {/* Select */}
                      {s.type === 'select' && (
                        <select value={String(value)} onChange={e => updateSetting(s.key, e.target.value)}
                          className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" style={{ appearance: 'auto' }}>
                          {s.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}

                      {/* Reset to default */}
                      {!isDefault && (
                        <button onClick={() => updateSetting(s.key, s.default_value)} title="Default руу буцаах"
                          className="text-[10px] text-[#999] hover:text-[#FF6B00] transition-colors flex-shrink-0">↩</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Changed summary */}
          {changed.size > 0 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-orange-700">{changed.size} тохиргоо өөрчлөгдсөн</div>
                <div className="text-xs text-orange-500 mt-0.5">
                  {Array.from(changed).slice(0, 5).join(', ')}{changed.size > 5 ? ` +${changed.size - 5}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setChanged(new Set()); window.location.reload() }}
                  className="px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors">
                  Цуцлах
                </button>
                <button onClick={saveAll} disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55D00] transition-colors">
                  {saving ? '⏳' : '💾 Хадгалах'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
