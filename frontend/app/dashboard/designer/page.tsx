'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Design Approval System moved to /designer/approval (designer sidebar)
export default function DesignerApprovalRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/designer/approval') }, [])
  return null
}
