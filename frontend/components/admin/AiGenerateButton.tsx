'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  label?: string
  className?: string
}

export function AiGenerateButton({ label = 'AI Generate', className }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`gap-1.5 text-xs bg-gradient-to-r from-violet-500/10 to-primary/10 border-violet-500/20 text-violet-600 hover:text-violet-700 hover:border-violet-500/30 ${className || ''}`}
      onClick={() => toast.info('AI хүч удахгүй нэмэгдэнэ', { description: 'Энэ функц хөгжүүлэгдэж байна' })}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
