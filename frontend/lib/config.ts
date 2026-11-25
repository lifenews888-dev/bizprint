/** BizPrint site configuration — single source of truth */

export const SITE_CONFIG = {
  phone: '+976 7200-0444',
  phoneDisplay: '7200-0444',
  phoneRaw: '97672000444',
  email: 'info@bizprint.mn',
  address: 'Логос Төв 7 давхар, 701 тоот, Чингэлтэй дүүрэг',
  workingHours: 'Даваа-Баасан: 09:00-18:00',
  companyName: 'BizPrint',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://bizprint.mn',
  social: {
    facebook: 'https://facebook.com/bizprintpro',
    instagram: 'https://instagram.com/bizprintpro25',
  },
}

// Legacy exports for backward compatibility
export const PHONE = SITE_CONFIG.phone
export const PHONE_RAW = SITE_CONFIG.phoneRaw
export const EMAIL = SITE_CONFIG.email
export const COMPANY_NAME = SITE_CONFIG.companyName
export const SITE_URL = SITE_CONFIG.siteUrl
export const ADDRESS = SITE_CONFIG.address
