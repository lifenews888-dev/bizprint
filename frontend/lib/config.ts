/** BizPrint site configuration — single source of truth */

export const SITE_CONFIG = {
  phone: '+976 7711-7700',
  phoneDisplay: '+976 7711-7700',
  phoneRaw: '97677117700',
  email: 'info@bizprint.mn',
  address: 'Улаанбаатар, Монгол',
  workingHours: 'Даваа-Баасан: 09:00-18:00',
  companyName: 'BizPrint',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://bizprint.mn',
  social: {
    facebook: 'https://facebook.com/bizprint.mn',
    instagram: 'https://instagram.com/bizprint.mn',
  },
}

// Legacy exports for backward compatibility
export const PHONE = SITE_CONFIG.phone
export const PHONE_RAW = SITE_CONFIG.phoneRaw
export const EMAIL = SITE_CONFIG.email
export const COMPANY_NAME = SITE_CONFIG.companyName
export const SITE_URL = SITE_CONFIG.siteUrl
export const ADDRESS = SITE_CONFIG.address
