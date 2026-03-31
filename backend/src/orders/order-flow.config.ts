/**
 * Order Flow Configuration
 * Maps product order_flow type to state machine behavior
 * State machine is FROZEN — we only skip/auto-transition, never add states
 */

export const ORDER_FLOW_CONFIG: Record<string, {
  skip_states: string[]
  auto_transitions: Record<string, string>
  label: string
}> = {
  // SHOP: Browse → Cart → Pay → Ship
  standard: {
    skip_states: ['QUOTATION_SENT', 'PENDING_FILE', 'FILE_REVIEW', 'FILE_REJECTED'],
    auto_transitions: { DRAFT: 'CONFIRMED' },
    label: 'Стандарт (Дэлгүүр)',
  },

  // PRINT: Select → Upload File → Review → Quote → Pay → Produce → Ship
  file_upload: {
    skip_states: [],
    auto_transitions: {},
    label: 'Файл хавсаргах (Хэвлэмэл)',
  },

  // SIGNAGE: Dimensions → Quote → Approve → Produce → Install
  site_survey: {
    skip_states: ['PENDING_FILE', 'FILE_REVIEW', 'FILE_REJECTED'],
    auto_transitions: {},
    label: 'Үнийн санал (Хаяг самбар)',
  },

  // DESIGN: Choose template → Customize → Download/Print
  template_customize: {
    skip_states: ['QUOTATION_SENT', 'PENDING_FILE', 'FILE_REVIEW', 'FILE_REJECTED', 'IN_PRODUCTION', 'FINISHING'],
    auto_transitions: { DRAFT: 'CONFIRMED', CONFIRMED: 'DISPATCHED' },
    label: 'Дижитал (Дизайн загвар)',
  },
}

export function getFlowConfig(orderFlow: string) {
  return ORDER_FLOW_CONFIG[orderFlow] || ORDER_FLOW_CONFIG.standard
}
