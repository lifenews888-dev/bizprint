'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandler } from '@/lib/services/error-reporter'

/** Attach global error handlers on mount — catches unhandled errors + promise rejections */
export default function ErrorBoundary() {
  useEffect(() => {
    setupGlobalErrorHandler('web')
  }, [])

  return null // Invisible component
}
