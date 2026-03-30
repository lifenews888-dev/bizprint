import type { OrderStatus, DeliveryStatus } from './index'
import { colors } from './theme'

// ─── Status Config ──────────────────────────────────
// Single source of truth for labels, colors, and emojis.
// Synced with web app (bizprint-customer/lib/types.ts)

export interface StatusEntry {
  label: string
  emoji: string
  color: string
  bg: string
}

// ─── Order Status ───────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusEntry> = {
  DRAFT:         { label: 'Ноорог',              emoji: '📝', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  CART:          { label: 'Сагс',                emoji: '🛒', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  QUOTATION:     { label: 'Үнийн санал',         emoji: '💰', color: colors.purple, bg: colors.purpleBg },
  CONFIRMED:     { label: 'Баталгаажсан',        emoji: '✅', color: colors.info, bg: colors.infoBg },
  PENDING_FILE:  { label: 'Файл хүлээж байна',   emoji: '📁', color: colors.warning, bg: colors.warningBg },
  FILE_REVIEW:   { label: 'Файл шалгаж байна',   emoji: '🔍', color: colors.warning, bg: colors.warningBg },
  IN_PRODUCTION: { label: 'Үйлдвэрлэж байна',   emoji: '🏭', color: colors.accent, bg: colors.accentBg },
  FINISHING:     { label: 'Дуусгаж байна',        emoji: '⚙️', color: colors.accent, bg: colors.accentBg },
  DISPATCHED:    { label: 'Илгээсэн',            emoji: '🚚', color: colors.success, bg: colors.successBg },
  DELIVERED:     { label: 'Хүргэсэн',            emoji: '📬', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  COMPLETED:     { label: 'Дууссан',              emoji: '🎉', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  CANCELLED:     { label: 'Цуцлагдсан',          emoji: '🚫', color: colors.error, bg: colors.errorBg },
  REFUNDED:      { label: 'Буцаагдсан',          emoji: '↩️', color: colors.error, bg: colors.errorBg },
}

// ─── Delivery Status ────────────────────────────────

export const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, StatusEntry> = {
  PENDING:   { label: 'Хүлээгдэж байна',    emoji: '⏳', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  ASSIGNED:  { label: 'Жолооч томилогдсон',  emoji: '👤', color: colors.info, bg: colors.infoBg },
  PICKED_UP: { label: 'Авсан',               emoji: '📥', color: colors.purple, bg: colors.purpleBg },
  IN_TRANSIT:{ label: 'Замд',                 emoji: '🚚', color: colors.accent, bg: colors.accentBg },
  DELIVERED: { label: 'Хүргэсэн',            emoji: '✅', color: colors.success, bg: colors.successBg },
  FAILED:    { label: 'Амжилтгүй',           emoji: '❌', color: colors.error, bg: colors.errorBg },
  RETURNED:  { label: 'Буцаагдсан',          emoji: '↩️', color: colors.warning, bg: colors.warningBg },
}

// ─── Order Workflow Stages (for steppers) ───────────

export const ORDER_WORKFLOW_STAGES = [
  { key: 'order',    label: 'Захиалга',   statuses: ['DRAFT', 'QUOTATION', 'CONFIRMED'] },
  { key: 'file',     label: 'Файл',       statuses: ['PENDING_FILE', 'FILE_REVIEW'] },
  { key: 'print',    label: 'Хэвлэх',     statuses: ['IN_PRODUCTION'] },
  { key: 'finish',   label: 'Дуусгал',    statuses: ['FINISHING'] },
  { key: 'shipping', label: 'Хүргэлт',    statuses: ['DISPATCHED'] },
  { key: 'done',     label: 'Дууссан',     statuses: ['DELIVERED', 'COMPLETED'] },
] as const

// ─── Helpers ────────────────────────────────────────

export function getOrderStatusEntry(status: string): StatusEntry {
  return ORDER_STATUS_CONFIG[status as OrderStatus] || { label: status, emoji: '❓', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
}

export function getDeliveryStatusEntry(status: string): StatusEntry {
  return DELIVERY_STATUS_CONFIG[status as DeliveryStatus] || { label: status, emoji: '❓', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
}

export function getWorkflowStageIndex(status: string): number {
  for (let i = 0; i < ORDER_WORKFLOW_STAGES.length; i++) {
    if ((ORDER_WORKFLOW_STAGES[i].statuses as readonly string[]).includes(status)) return i
  }
  return -1
}
