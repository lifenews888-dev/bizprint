'use client'
import React from 'react'

import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function AdminPageHeader({ title, description, children, className }: Props) {
  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6', className)}>
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
