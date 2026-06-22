import { Suspense } from 'react'
import DesignEditorGate from './DesignEditorGate'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <DesignEditorGate>{children}</DesignEditorGate>
    </Suspense>
  )
}
