'use client'
import React, { useState, useRef, useEffect } from 'react'
import React, { API_URL, getToken } from '@/lib/api'

interface PdfViewerProps {
  /** File URL path (e.g., /uploads/123-file.pdf) or full URL */
  fileUrl: string
  /** Optional filename to display */
  filename?: string
  /** Optional analysis data from PDF Inspector */
  analysis?: {
    score?: number
    risk?: string
    summary?: string
    pages?: number
    page_width_mm?: number
    page_height_mm?: number
    issues?: Array<{ type: string; severity: string; message: string }>
    checks?: Record<string, { status: string; detail: string }>
  }
  /** Width of the viewer */
  width?: number | string
  /** Height of the viewer */
  height?: number | string
  /** Whether to show the analysis panel */
  showAnalysis?: boolean
  /** Called when the viewer is closed */
  onClose?: () => void
}

const RISK_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  LOW:      { color: '#10B981', bg: '#ECFDF5', label: 'Бага эрсдэл' },
  MEDIUM:   { color: '#F59E0B', bg: '#FFFBEB', label: 'Дунд эрсдэл' },
  HIGH:     { color: '#EF4444', bg: '#FEF2F2', label: 'Өндөр эрсдэл' },
  CRITICAL: { color: '#991B1B', bg: '#FEE2E2', label: 'Маш өндөр эрсдэл' },
}

const CHECK_STATUS_ICONS: Record<string, string> = {
  pass: '\u2705',
  warning: '\u26A0\uFE0F',
  fail: '\u274C',
  info: '\u2139\uFE0F',
}

export default function PdfViewer({
  fileUrl,
  filename,
  analysis,
  width = '100%',
  height = 600,
  showAnalysis = true,
  onClose,
}: PdfViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [tab, setTab] = useState<'preview' | 'analysis'>('preview')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Build full URL
  const fullUrl = fileUrl.startsWith('http')
    ? fileUrl
    : `${API_URL}${fileUrl}`

  const isPdf = fileUrl.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpg|jpeg|png|gif|webp|tiff)$/i.test(fileUrl)

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: '#1F2937', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14 }}>{isPdf ? '\uD83D\uDCC4' : '\uD83D\uDDBC\uFE0F'}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {filename || fileUrl.split('/').pop()}
          </span>
          {analysis?.pages && (
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              {analysis.pages} хуудас
              {analysis.page_width_mm && analysis.page_height_mm
                ? ` · ${analysis.page_width_mm}×${analysis.page_height_mm}мм`
                : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tabs */}
          {showAnalysis && analysis && (
            <div style={{ display: 'flex', gap: 2, marginRight: 8 }}>
              <button onClick={() => setTab('preview')} style={{
                padding: '4px 12px', borderRadius: '6px 0 0 6px', border: 'none', cursor: 'pointer',
                background: tab === 'preview' ? '#FF6B00' : '#374151',
                color: '#fff', fontSize: 11, fontWeight: 600,
              }}>Харах</button>
              <button onClick={() => setTab('analysis')} style={{
                padding: '4px 12px', borderRadius: '0 6px 6px 0', border: 'none', cursor: 'pointer',
                background: tab === 'analysis' ? '#FF6B00' : '#374151',
                color: '#fff', fontSize: 11, fontWeight: 600,
              }}>Шинжилгээ</button>
            </div>
          )}

          {/* Zoom controls (preview only) */}
          {tab === 'preview' && (
            <>
              <button onClick={() => setZoom(z => Math.max(50, z - 25))} style={zoomBtnStyle}>−</button>
              <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 36, textAlign: 'center' }}>{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} style={zoomBtnStyle}>+</button>
            </>
          )}

          {/* Download */}
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" download
            style={{ ...zoomBtnStyle, textDecoration: 'none', color: '#fff', fontSize: 12 }}>
            ⬇
          </a>

          {/* Close */}
          {onClose && (
            <button onClick={onClose} style={{ ...zoomBtnStyle, fontSize: 14 }}>✕</button>
          )}
        </div>
      </div>

      {/* Content area */}
      {tab === 'preview' ? (
        <div style={{
          width, height: typeof height === 'number' ? height : height,
          overflow: 'auto', background: '#F3F4F6',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: 16,
        }}>
          {isPdf ? (
            <iframe
              ref={iframeRef}
              src={`${fullUrl}#toolbar=1&zoom=${zoom}`}
              style={{
                width: `${zoom}%`,
                height: typeof height === 'number' ? height - 32 : '100%',
                border: 'none',
                borderRadius: 8,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              title="PDF Preview"
            />
          ) : isImage ? (
            <img
              src={fullUrl}
              alt={filename || 'Preview'}
              style={{
                maxWidth: `${zoom}%`,
                height: 'auto',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Preview боломжгүй</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Файлыг татаж авч үзнэ үү</div>
              <a href={fullUrl} target="_blank" rel="noopener noreferrer" download style={{
                display: 'inline-block', marginTop: 16, padding: '10px 24px',
                background: '#FF6B00', color: '#fff', borderRadius: 8,
                textDecoration: 'none', fontWeight: 700, fontSize: 13,
              }}>Татах</a>
            </div>
          )}
        </div>
      ) : (
        /* Analysis panel */
        <div style={{ padding: 20, maxHeight: typeof height === 'number' ? height : 600, overflowY: 'auto' }}>
          {analysis ? (
            <>
              {/* Score + Risk */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{
                  flex: 1, padding: 16, borderRadius: 12, textAlign: 'center',
                  background: analysis.score! >= 80 ? '#ECFDF5' : analysis.score! >= 60 ? '#FFFBEB' : '#FEF2F2',
                  border: `1px solid ${analysis.score! >= 80 ? '#A7F3D0' : analysis.score! >= 60 ? '#FDE68A' : '#FECACA'}`,
                }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: analysis.score! >= 80 ? '#10B981' : analysis.score! >= 60 ? '#F59E0B' : '#EF4444' }}>
                    {analysis.score}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>/ 100 оноо</div>
                </div>

                {analysis.risk && (
                  <div style={{
                    flex: 1, padding: 16, borderRadius: 12, textAlign: 'center',
                    background: RISK_COLORS[analysis.risk]?.bg || '#F9FAFB',
                    border: `1px solid ${RISK_COLORS[analysis.risk]?.color || '#E5E7EB'}20`,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: RISK_COLORS[analysis.risk]?.color || '#666' }}>
                      {RISK_COLORS[analysis.risk]?.label || analysis.risk}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Эрсдэлийн түвшин</div>
                  </div>
                )}
              </div>

              {/* Summary */}
              {analysis.summary && (
                <div style={{
                  padding: 14, borderRadius: 10, background: '#F9FAFB',
                  border: '1px solid #E5E7EB', marginBottom: 16, fontSize: 13, color: '#333', lineHeight: 1.5,
                }}>
                  {analysis.summary}
                </div>
              )}

              {/* Checks */}
              {analysis.checks && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#111' }}>Шалгалтын үр дүн</div>
                  {Object.entries(analysis.checks).map(([key, check]) => (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8, marginBottom: 4,
                      background: check.status === 'fail' ? '#FEF2F2' : check.status === 'warning' ? '#FFFBEB' : '#F9FAFB',
                    }}>
                      <span style={{ fontSize: 14 }}>{CHECK_STATUS_ICONS[check.status] || '\u2139\uFE0F'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333', textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 11, color: '#666' }}>{check.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Issues */}
              {analysis.issues && analysis.issues.length > 0 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#111' }}>
                    Илэрсэн асуудлууд ({analysis.issues.length})
                  </div>
                  {analysis.issues.map((issue, i) => (
                    <div key={i} style={{
                      padding: '8px 14px', borderRadius: 8, marginBottom: 4,
                      background: issue.severity === 'error' ? '#FEF2F2' : issue.severity === 'warning' ? '#FFFBEB' : '#F9FAFB',
                      fontSize: 12, color: '#333', display: 'flex', gap: 8,
                    }}>
                      <span style={{ fontWeight: 600 }}>
                        {issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              Шинжилгээний мэдээлэл байхгүй
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const zoomBtnStyle: React.CSSProperties = {
  background: '#374151',
  border: 'none',
  borderRadius: 6,
  padding: '4px 8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}
