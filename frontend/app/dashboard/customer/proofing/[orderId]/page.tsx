'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface ProofVersion {
  id: string; version: number; fileUrl: string;
  status: 'pending' | 'approved' | 'changes_requested';
  annotations: Annotation[]; reviewedAt?: string; createdAt: string;
}
interface Annotation {
  id: string; x: number; y: number; text: string;
  author: string; createdAt: string; resolved: boolean;
}

export default function ProofingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const [versions, setVersions] = useState<ProofVersion[]>([]);
  const [current, setCurrent] = useState<ProofVersion | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [adding, setAdding] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState<{ x: number; y: number } | null>(null);
  const [annotText, setAnnotText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'request_changes' | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const vers = await apiFetch<ProofVersion[]>(`/proofing/${orderId}/versions`).catch(() => []);
    const list = Array.isArray(vers) ? vers : [];
    setVersions(list);
    if (list.length > 0) {
      const latest = list[list.length - 1];
      setCurrent(latest);
      setAnnotations(latest.annotations ?? []);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const selectVersion = (v: ProofVersion) => {
    setCurrent(v);
    setAnnotations(v.annotations ?? []);
    setAdding(false);
    setNewAnnotation(null);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!adding || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewAnnotation({ x, y });
  };

  const saveAnnotation = async () => {
    if (!newAnnotation || !annotText.trim() || !current) return;
    const ann: Annotation = {
      id: Date.now().toString(), x: newAnnotation.x, y: newAnnotation.y,
      text: annotText.trim(), author: 'Та', createdAt: new Date().toISOString(), resolved: false,
    };
    setAnnotations(prev => [...prev, ann]);
    setNewAnnotation(null); setAnnotText(''); setAdding(false);

    await apiFetch(`/proofing/${orderId}/versions/${current.id}/annotations`, {
      method: 'POST', body: JSON.stringify(ann), headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  };

  const resolveAnnotation = async (annId: string) => {
    setAnnotations(prev => prev.map(a => a.id === annId ? { ...a, resolved: true } : a));
    if (!current) return;
    await apiFetch(`/proofing/${orderId}/versions/${current.id}/annotations/${annId}/resolve`, { method: 'PATCH' }).catch(() => {});
  };

  const submitDecision = async () => {
    if (!decision || !current) return;
    setSubmitting(true);
    await apiFetch(`/proofing/${orderId}/versions/${current.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status: decision === 'approve' ? 'approved' : 'changes_requested', note: decisionNote }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
    setSubmitting(false); setDecision(null); setDecisionNote('');
    load();
  };

  const openAnnots = annotations.filter(a => !a.resolved);
  const resolvedAnnots = annotations.filter(a => a.resolved);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Left: PDF viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => router.back()} style={{ color: 'var(--text4)' }}>← Буцах</button>
          <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
          <span className="text-sm font-medium flex-1" style={{ color: 'var(--text)' }}>Proof шалгалт</span>

          {versions.length > 1 && (
            <div className="flex items-center gap-1">
              {versions.map(v => (
                <button key={v.id} onClick={() => selectVersion(v)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: current?.id === v.id ? '#FF6B00' : 'var(--surface2)',
                    color: current?.id === v.id ? '#fff' : 'var(--text3)',
                  }}>
                  v{v.version}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => { setAdding(!adding); setNewAnnotation(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: adding ? '#FF6B00' : 'transparent',
              color: adding ? '#fff' : 'var(--text3)',
              border: adding ? 'none' : '1px solid var(--border)',
            }}>
            {adding ? 'Болих' : '+ Annotation'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div ref={containerRef} onClick={handleContainerClick}
            className="relative mx-auto rounded-lg overflow-hidden shadow-lg"
            style={{ maxWidth: 800, minHeight: 600, background: 'var(--surface)', cursor: adding ? 'crosshair' : 'default' }}>
            {current?.fileUrl ? (
              <iframe src={`${current.fileUrl}#toolbar=0`} className="w-full" style={{ height: 800, border: 'none', pointerEvents: adding ? 'none' : 'auto' }} title="PDF proof" />
            ) : (
              <div className="flex items-center justify-center h-96 text-sm" style={{ color: 'var(--text4)' }}>
                PDF файл ачаалж байна...
              </div>
            )}

            {annotations.filter(a => !a.resolved).map((ann, i) => (
              <div key={ann.id} className="absolute group" style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform" style={{ background: '#FF6B00' }}>
                  {i + 1}
                </div>
                <div className="absolute left-8 top-0 w-48 rounded-xl p-3 shadow-xl hidden group-hover:block z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text2)' }}>{ann.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text4)' }}>{ann.author}</span>
                    <button onClick={() => resolveAnnotation(ann.id)} className="text-xs hover:underline" style={{ color: '#059669' }}>Шийдэгдсэн</button>
                  </div>
                </div>
              </div>
            ))}

            {newAnnotation && (
              <div className="absolute" style={{ left: `${newAnnotation.x}%`, top: `${newAnnotation.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse" style={{ background: '#378ADD' }}>+</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
        {newAnnotation && (
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(55,138,221,0.05)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: '#378ADD' }}>Annotation нэмэх</p>
            <textarea value={annotText} onChange={e => setAnnotText(e.target.value)} placeholder="Тайлбар бичих..." rows={3} autoFocus
              className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setNewAnnotation(null); setAnnotText(''); }}
                className="flex-1 py-1.5 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>Цуцлах</button>
              <button onClick={saveAnnotation} disabled={!annotText.trim()}
                className="flex-1 py-1.5 text-white rounded-lg text-xs font-medium disabled:opacity-50" style={{ background: '#378ADD' }}>Нэмэх</button>
            </div>
          </div>
        )}

        {current && (
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text3)' }}>Статус</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                background: current.status === 'approved' ? 'rgba(5,150,105,0.1)' : current.status === 'changes_requested' ? 'rgba(217,119,6,0.1)' : 'var(--surface2)',
                color: current.status === 'approved' ? '#059669' : current.status === 'changes_requested' ? '#D97706' : 'var(--text3)',
              }}>
                {current.status === 'approved' ? 'Батлагдсан' : current.status === 'changes_requested' ? 'Засвар шүүрдүүлэй' : 'Хүлээгдэж байна'}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text4)' }}>Хувилбар {current.version}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {openAnnots.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text3)' }}>Нээлттэй ({openAnnots.length})</p>
              <div className="space-y-2 mb-4">
                {openAnnots.map((ann, i) => (
                  <div key={ann.id} className="rounded-xl p-3" style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)' }}>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#FF6B00' }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs" style={{ color: 'var(--text2)' }}>{ann.text}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text4)' }}>{ann.author}</p>
                      </div>
                    </div>
                    <button onClick={() => resolveAnnotation(ann.id)} className="mt-2 text-xs hover:underline" style={{ color: '#059669' }}>
                      Шийдэгдсэн гэж тэмдэглэх
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {resolvedAnnots.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text4)' }}>Шийдэгдсэн ({resolvedAnnots.length})</p>
              <div className="space-y-1">
                {resolvedAnnots.map(ann => (
                  <div key={ann.id} className="p-2 rounded-lg" style={{ background: 'var(--surface2)' }}>
                    <p className="text-xs line-through" style={{ color: 'var(--text4)' }}>{ann.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {annotations.length === 0 && (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--text4)' }}>
              {adding ? 'PDF дээр дарж annotation нэмнэ' : 'Annotation байхгүй'}
            </div>
          )}
        </div>

        {current?.status === 'pending' && (
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            {!decision ? (
              <div className="space-y-2">
                <button onClick={() => setDecision('approve')}
                  className="w-full py-2.5 text-white rounded-xl text-sm font-medium transition-colors" style={{ background: '#059669' }}>
                  Батлах
                </button>
                <button onClick={() => setDecision('request_changes')}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ border: '1px solid #D9770650', color: '#D97706' }}>
                  Засвар шүүрдэх
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text3)' }}>
                  {decision === 'approve' ? 'Батлах тайлбар (заавал биш)' : 'Ямар засвар хийх вэ?'}
                </p>
                <textarea value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
                  rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none mb-3"
                  style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                <div className="flex gap-2">
                  <button onClick={() => setDecision(null)} className="flex-1 py-2 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>Буцах</button>
                  <button onClick={submitDecision} disabled={submitting || (decision === 'request_changes' && !decisionNote.trim())}
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors"
                    style={{ background: decision === 'approve' ? '#059669' : '#D97706' }}>
                    {submitting ? '...' : decision === 'approve' ? 'Батлах' : 'Илгээх'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {current?.status === 'approved' && (
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2" style={{ color: '#059669' }}>
              <span className="text-sm font-medium">Батлагдсан</span>
            </div>
            {current.reviewedAt && <p className="text-xs mt-1" style={{ color: 'var(--text4)' }}>{new Date(current.reviewedAt).toLocaleString('mn-MN')}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
