'use client'
import { useEffect } from 'react'
import { saveUTM } from '@/lib/utm'

export function UTMTracker() {
  useEffect(() => { saveUTM() }, [])
  return null
}
