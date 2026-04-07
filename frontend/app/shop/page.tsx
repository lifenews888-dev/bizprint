import { Suspense } from 'react'
import ShopPageInner from './ShopPageInner'

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>}>
      <ShopPageInner />
    </Suspense>
  )
}
