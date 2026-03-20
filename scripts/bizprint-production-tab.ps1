# BizPrint - Add ProductionTab to workflow page
# Run: .\bizprint-production-tab.ps1

$WORKFLOW = "C:\Users\User\projects\bizprint\frontend\app\admin\workflow\page.tsx"
$PRODTAB  = "C:\Users\User\projects\bizprint\frontend\app\admin\workflow\components\ProductionTab.tsx"
$DELTAB   = "C:\Users\User\projects\bizprint\frontend\app\admin\workflow\components\DeliveryTab.tsx"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Adding ProductionTab to workflow" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] $path" -ForegroundColor Green
}

# ============================================================
# READ existing workflow page
# ============================================================
$existing = [System.IO.File]::ReadAllText($WORKFLOW, [System.Text.Encoding]::UTF8)

# ============================================================
# Check if already patched
# ============================================================
if ($existing -match "ProductionJobsSection|production-jobs.*fetch|fetchProductionJobs") {
    Write-Host "  [SKIP] Already patched" -ForegroundColor Yellow
} else {
    Write-Host "[1/2] Patching workflow page..." -ForegroundColor Yellow

    # Add import at top (after 'use client')
    $importLine = "import ProductionTab from './components/ProductionTab'"
    $existing = $existing -replace "('use client')", "`$1`r`nimport ProductionTab from './components/ProductionTab'"

    # Replace empty production stage with ProductionTab component
    # Find the production placeholder block and replace it
    $placeholder = @"
      {/* PRODUCTION tab */}
"@
    # We'll append a ProductionTab call right after the placeholder comment
    # Strategy: replace the entire production stage block using a known unique string
    $oldBlock = "stage === 'production' &&"
    $newBlock = "stage === 'production' && <ProductionTab />"
    
    # Find and replace production block - it starts with stage === 'production' &&
    # Use regex to match the whole block
    $patched = [System.Text.RegularExpressions.Regex]::Replace(
        $existing,
        "(?s)\{/\* PRODUCTION tab \*/\}.*?\{stage === 'production' && \(.*?\)\s*\}",
        "{/* PRODUCTION tab */}`r`n      {stage === 'production' && <ProductionTab />}"
    )

    if ($patched -eq $existing) {
        Write-Host "  [WARN] Regex replace did not match, trying fallback..." -ForegroundColor Yellow
        # Fallback: just append import + note
        Write-Host "  [INFO] Please manually replace the production stage block" -ForegroundColor Yellow
    } else {
        [System.IO.File]::WriteAllText($WORKFLOW, $patched, [System.Text.Encoding]::UTF8)
        Write-Host "  [OK] workflow page patched" -ForegroundColor Green
    }
}

# ============================================================
# Write ProductionTab component
# ============================================================
Write-Host "[2/2] Writing ProductionTab component..." -ForegroundColor Yellow

Write-File $PRODTAB @"
'use client'

import { useEffect, useState } from 'react'

const API = 'http://localhost:4000'
const authH = () => ({
  'Content-Type': 'application/json',
  Authorization: 'Bearer ' + (localStorage.getItem('access_token') || ''),
})

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending',
  in_progress: 'Printing',
  completed:   'Done',
  cancelled:   'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  pending:     '#F59E0B',
  in_progress: '#3B82F6',
  completed:   '#10B981',
  cancelled:   '#EF4444',
}

export default function ProductionTab() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    try {
      const res = await fetch(API + '/production-jobs', { headers: authH() })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(jobId: number, status: string) {
    await fetch(API + '/production-jobs/' + jobId + '/status', {
      method: 'PATCH',
      headers: authH(),
      body: JSON.stringify({ status }),
    })
    setMsg('Status updated')
    setTimeout(() => setMsg(''), 2000)
    fetchJobs()
  }

  async function createJobFromOrder(orderId: string) {
    await fetch(API + '/production-jobs/from-order/' + orderId, {
      method: 'POST',
      headers: authH(),
    })
    setMsg('Production job created')
    setTimeout(() => setMsg(''), 2000)
    fetchJobs()
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
  )

  return (
    <div>
      {msg && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1D9E75', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>
        Production Jobs
      </h2>

      {jobs.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏭</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No production jobs yet</div>
          <div style={{ fontSize: 13 }}>Jobs appear here when design is approved</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>Job</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>#{job.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>
                    {job.created_at ? new Date(job.created_at).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>Order</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    #{job.order?.id?.slice(0, 8) ?? '-'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {job.order?.customer_name ?? ''}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>Product</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    {job.order?.product_name ?? '-'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {job.order?.quantity ? job.order.quantity + ' pcs' : ''}
                  </div>
                </div>
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: (STATUS_COLORS[job.status] || '#888') + '20',
                    color: STATUS_COLORS[job.status] || '#888',
                  }}>
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </div>
                <div>
                  <select
                    value={job.status}
                    onChange={(e) => updateStatus(job.id, e.target.value)}
                    style={{
                      padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)',
                      background: 'var(--surface2)', color: 'var(--text)', fontSize: 12,
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">Printing</option>
                    <option value="completed">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
"@

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  DONE!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: check if workflow page was patched" -ForegroundColor Yellow
Write-Host "  If [WARN] appeared - manually add to page:" -ForegroundColor White
Write-Host "  1. Add import at top:" -ForegroundColor Gray
Write-Host "     import ProductionTab from './components/ProductionTab'" -ForegroundColor Gray
Write-Host "  2. Replace production stage block with:" -ForegroundColor Gray
Write-Host "     {stage === 'production' && <ProductionTab />}" -ForegroundColor Gray
Write-Host ""
