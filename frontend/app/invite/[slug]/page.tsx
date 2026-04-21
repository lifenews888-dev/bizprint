'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const FONT = "'Cormorant Garamond','DM Sans','Segoe UI',serif"
const SANS = "'DM Sans','Segoe UI',system-ui,sans-serif"

// ════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════
export default function InvitePage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const guestName = searchParams.get('guest') || ''

  const [inv, setInv] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [entered, setEntered] = useState(false)
  const [muted, setMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  // RSVP state
  const [rsvpStatus, setRsvpStatus] = useState<string>('')
  const [rsvpName, setRsvpName] = useState(guestName)
  const [rsvpMessage, setRsvpMessage] = useState('')
  const [rsvpDeclineReason, setRsvpDeclineReason] = useState('')
  const [rsvpCount, setRsvpCount] = useState(1)
  const [rsvpSent, setRsvpSent] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/invite/${slug}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/invite/${slug}/stats`).then(r => r.ok ? r.json() : null),
    ]).then(([i, s]) => { setInv(i); setStats(s) })
      .finally(() => setLoading(false))
  }, [slug])

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return
    if (muted) { audioRef.current.play().catch(() => {}); setMuted(false) }
    else { audioRef.current.pause(); setMuted(true) }
  }, [muted])

  const handleEnter = () => {
    setEntered(true)
    if (audioRef.current && inv?.music_url) {
      audioRef.current.play().then(() => setMuted(false)).catch(() => {})
    }
  }

  const submitRsvp = async () => {
    if (!rsvpName.trim() || !rsvpStatus) return
    setRsvpLoading(true)
    try {
      await fetch(`${API}/api/invite/${slug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rsvpName,
          rsvp_status: rsvpStatus,
          guest_count: rsvpCount,
          message: rsvpMessage,
          decline_reason: rsvpStatus === 'declined' ? rsvpDeclineReason : undefined,
        }),
      })
      setRsvpSent(true)
      // Refresh stats
      const s = await fetch(`${API}/api/invite/${slug}/stats`).then(r => r.json()).catch(() => null)
      if (s) setStats(s)
    } catch {}
    setRsvpLoading(false)
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (!inv) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F4AD;</div><div style={{ fontSize: 20 }}>Урилга олдсонгүй</div></div>
    </div>
  )

  const accent = inv.accent_color || '#D4AF37'
  const eventDate = inv.event_date ? new Date(inv.event_date) : null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: FONT, overflowX: 'hidden' }}>
      {/* Hidden audio */}
      {inv.music_url && <audio ref={audioRef} src={inv.music_url} loop preload="auto" />}

      {/* ════════ ENTRY SCREEN ════════ */}
      {!entered && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: inv.cover_image_url
            ? `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.7)),url(${inv.cover_image_url}) center/cover`
            : `radial-gradient(ellipse at 30% 20%, ${accent}15, transparent 60%), #0a0a0a`,
          animation: 'entryFadeIn 1.2s ease',
        }}>
          <div style={{ textAlign: 'center', padding: 32, maxWidth: 480, animation: 'slideUp 1.4s ease' }}>
            {/* Ornament */}
            <div style={{ fontSize: 14, letterSpacing: 8, color: accent, opacity: 0.7, marginBottom: 24, textTransform: 'uppercase', fontFamily: SANS }}>
              {inv.type === 'wedding' ? 'УРИЛГА' : inv.type === 'birthday' ? 'ТӨРСӨН ӨДӨР' : 'УРИЛГА'}
            </div>

            {/* Guest personalization */}
            {guestName && (
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontFamily: SANS, animation: 'fadeIn 2s ease' }}>
                Эрхэм <span style={{ color: accent, fontWeight: 600 }}>{guestName}</span> таныг урьж байна
              </div>
            )}

            {/* Names / Title */}
            <h1 style={{ fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 300, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: 2 }}>
              {inv.hero_section?.names || inv.title}
            </h1>

            {inv.hero_section?.subtitle && (
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 300, margin: '0 0 40px', fontFamily: SANS }}>{inv.hero_section.subtitle}</p>
            )}

            {/* Enter button */}
            <button onClick={handleEnter} style={{
              padding: '16px 48px', background: 'transparent', border: `1px solid ${accent}`,
              color: accent, fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: SANS, fontWeight: 500, transition: 'all 0.4s ease',
              animation: 'pulse 2s ease-in-out infinite',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#0a0a0a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = accent }}
            >
              Урилга нээх
            </button>

            {inv.music_url && (
              <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: SANS }}>
                &#x1F3B5; Хөгжимтэй
              </div>
            )}
          </div>

          <style>{`
            @keyframes entryFadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: translateY(0) } }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }
          `}</style>
        </div>
      )}

      {/* ════════ MAIN CONTENT (after enter) ════════ */}
      {entered && (
        <div style={{ animation: 'contentReveal 1s ease' }}>
          {/* Music toggle */}
          {inv.music_url && (
            <button onClick={toggleMusic} style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 90,
              width: 48, height: 48, borderRadius: '50%', border: `1px solid ${accent}40`,
              background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(10px)',
              color: accent, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {muted ? '\u{1F507}' : '\u{1F50A}'}
            </button>
          )}

          {/* ── HERO ── */}
          <section style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '60px 24px', textAlign: 'center', position: 'relative',
            background: inv.cover_image_url
              ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.6)),url(${inv.cover_image_url}) center/cover fixed`
              : `radial-gradient(ellipse at 50% 0%, ${accent}08, transparent 60%), #0a0a0a`,
          }}>
            {/* Decorative line */}
            <div style={{ width: 1, height: 60, background: `linear-gradient(transparent, ${accent})`, marginBottom: 32, animation: 'growDown 1.5s ease' }} />

            {inv.hero_section?.greeting && (
              <div style={{ fontSize: 14, letterSpacing: 6, color: accent, opacity: 0.8, marginBottom: 20, textTransform: 'uppercase', fontFamily: SANS, animation: 'fadeSlideUp 1s ease 0.3s both' }}>
                {inv.hero_section.greeting}
              </div>
            )}

            {guestName && (
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 16, fontFamily: SANS, animation: 'fadeSlideUp 1s ease 0.5s both' }}>
                Эрхэм <span style={{ color: accent }}>{guestName}</span>
              </div>
            )}

            <h1 style={{ fontSize: 'clamp(36px, 10vw, 64px)', fontWeight: 300, lineHeight: 1.2, margin: '0 0 20px', animation: 'fadeSlideUp 1s ease 0.6s both' }}>
              {inv.hero_section?.names || inv.title}
            </h1>

            {inv.hero_section?.subtitle && (
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 300, maxWidth: 500, fontFamily: SANS, animation: 'fadeSlideUp 1s ease 0.8s both' }}>{inv.hero_section.subtitle}</p>
            )}

            {eventDate && (
              <div style={{ marginTop: 32, fontSize: 16, letterSpacing: 4, color: accent, fontFamily: SANS, animation: 'fadeSlideUp 1s ease 1s both' }}>
                {eventDate.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}

            {/* Scroll indicator */}
            <div style={{ position: 'absolute', bottom: 32, animation: 'bounce 2s ease infinite' }}>
              <svg width="24" height="24" fill="none" stroke={accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 14l-7 7-7-7M19 7l-7 7-7-7" opacity="0.4"/></svg>
            </div>
          </section>

          {/* ── COUNTDOWN ── */}
          {inv.show_countdown && eventDate && (
            <CountdownSection eventDate={eventDate} accent={accent} />
          )}

          {/* ── EVENT DETAILS ── */}
          <section style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
            <SectionTitle text="Арга хэмжээ" accent={accent} />

            <div style={{ display: 'grid', gap: 24, marginTop: 40 }}>
              {eventDate && (
                <DetailCard icon="&#x1F4C5;" label="Огноо" value={eventDate.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} accent={accent} />
              )}
              {inv.event_time && (
                <DetailCard icon="&#x1F552;" label="Цаг" value={inv.event_time} accent={accent} />
              )}
              {inv.venue_name && (
                <DetailCard icon="&#x1F4CD;" label="Байршил" value={inv.venue_name} sub={inv.venue_address} accent={accent} />
              )}
            </div>
          </section>

          {/* ── MAP ── */}
          {inv.show_map && inv.venue_lat && inv.venue_lng && (
            <section style={{ padding: '0 24px 80px', maxWidth: 640, margin: '0 auto' }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${accent}20` }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${inv.venue_lat},${inv.venue_lng}&z=15&output=embed`}
                  style={{ width: '100%', height: 280, border: 'none', filter: 'invert(0.9) hue-rotate(180deg) brightness(1.2) contrast(0.9)' }}
                  loading="lazy"
                />
              </div>
              {inv.venue_lat && (
                <a href={`https://maps.google.com/?q=${inv.venue_lat},${inv.venue_lng}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', textAlign: 'center', marginTop: 16, color: accent, fontSize: 14, fontFamily: SANS, textDecoration: 'none',
                }}>
                  Google Maps дээр нээх &#x2192;
                </a>
              )}
            </section>
          )}

          {/* ── STORY TIMELINE ── */}
          {inv.story_timeline?.length > 0 && (
            <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px' }}>
              <SectionTitle text="Бидний түүх" accent={accent} />
              <div style={{ marginTop: 40, position: 'relative', paddingLeft: 32 }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: `${accent}30` }} />
                {inv.story_timeline.map((s: any, i: number) => (
                  <div key={i} style={{ marginBottom: 40, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -28, top: 4, width: 10, height: 10, borderRadius: '50%', background: accent }} />
                    {s.date && <div style={{ fontSize: 13, color: accent, fontFamily: SANS, letterSpacing: 2, marginBottom: 6 }}>{s.date}</div>}
                    {s.title && <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 6 }}>{s.title}</div>}
                    {s.description && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: SANS, lineHeight: 1.7 }}>{s.description}</div>}
                    {s.image_url && <img src={s.image_url} alt="" style={{ marginTop: 12, borderRadius: 12, maxWidth: '100%', maxHeight: 250, objectFit: 'cover' }} />}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── RSVP ── */}
          {inv.rsvp_enabled && (
            <section style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px 80px' }}>
              <SectionTitle text="Хариу илгээх" accent={accent} />

              {!rsvpSent ? (
                <div style={{ marginTop: 40, background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}20`, borderRadius: 20, padding: 32 }}>
                  {/* Name */}
                  <input value={rsvpName} onChange={e => setRsvpName(e.target.value)} placeholder="Таны нэр" style={{
                    width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 15, fontFamily: SANS, marginBottom: 16, outline: 'none',
                  }} />

                  {/* RSVP buttons */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    {[
                      { value: 'attending', label: 'Ирнэ', emoji: '\u2705' },
                      { value: 'maybe', label: 'Магадгүй', emoji: '\u{1F914}' },
                      { value: 'declined', label: 'Ирэхгүй', emoji: '\u{1F614}' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setRsvpStatus(opt.value)} style={{
                        flex: 1, padding: '14px 8px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontFamily: SANS,
                        border: rsvpStatus === opt.value ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)',
                        background: rsvpStatus === opt.value ? `${accent}15` : 'rgba(255,255,255,0.03)',
                        color: rsvpStatus === opt.value ? accent : 'rgba(255,255,255,0.6)',
                        fontWeight: rsvpStatus === opt.value ? 600 : 400, transition: 'all 0.3s',
                      }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.emoji}</div>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Guest count */}
                  {rsvpStatus === 'attending' && (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: SANS }}>Хүн:</span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setRsvpCount(n)} style={{
                          width: 36, height: 36, borderRadius: '50%', border: rsvpCount === n ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)',
                          background: rsvpCount === n ? `${accent}20` : 'transparent',
                          color: rsvpCount === n ? accent : 'rgba(255,255,255,0.4)',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                        }}>{n}</button>
                      ))}
                    </div>
                  )}

                  {/* Decline reason */}
                  {rsvpStatus === 'declined' && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontFamily: SANS }}>Хүндэтгэх шалтгаан:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {['Ажлын шалтгаан', 'Аялалд', 'Гэр бүлийн шалтгаан', 'Эрүүл мэнд', 'Бусад'].map(reason => (
                          <button key={reason} onClick={() => setRsvpDeclineReason(reason)} style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontFamily: SANS, cursor: 'pointer',
                            border: rsvpDeclineReason === reason ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.15)',
                            background: rsvpDeclineReason === reason ? `${accent}20` : 'rgba(255,255,255,0.05)',
                            color: rsvpDeclineReason === reason ? accent : 'rgba(255,255,255,0.5)',
                          }}>{reason}</button>
                        ))}
                      </div>
                      {rsvpDeclineReason === 'Бусад' && (
                        <input value={rsvpDeclineReason === 'Бусад' ? '' : rsvpDeclineReason}
                          onChange={e => setRsvpDeclineReason(e.target.value)}
                          placeholder="Шалтгаанаа бичнэ үү..."
                          style={{
                            width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                            color: '#fff', fontSize: 13, fontFamily: SANS, outline: 'none',
                          }} />
                      )}
                    </div>
                  )}

                  {/* Message */}
                  <textarea value={rsvpMessage} onChange={e => setRsvpMessage(e.target.value)}
                    placeholder={rsvpStatus === 'attending' ? 'Баяр хүргэе! Мэндчилгээ...' : rsvpStatus === 'declined' ? 'Уучлаарай, нэмэлт тайлбар...' : 'Мэнд хүргэе... (заавал биш)'}
                    rows={3} style={{
                    width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: SANS, resize: 'none', marginBottom: 20, outline: 'none',
                  }} />

                  {/* Submit */}
                  <button onClick={submitRsvp} disabled={rsvpLoading || !rsvpName.trim() || !rsvpStatus} style={{
                    width: '100%', padding: '16px', background: rsvpName.trim() && rsvpStatus ? accent : 'rgba(255,255,255,0.05)',
                    color: rsvpName.trim() && rsvpStatus ? '#0a0a0a' : 'rgba(255,255,255,0.2)',
                    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: SANS,
                    cursor: rsvpName.trim() && rsvpStatus ? 'pointer' : 'not-allowed', transition: 'all 0.3s',
                  }}>
                    {rsvpLoading ? 'Илгээж байна...' : 'Хариу илгээх'}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 40, textAlign: 'center', animation: 'fadeSlideUp 0.6s ease' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>{rsvpStatus === 'attending' ? '\u{1F389}' : rsvpStatus === 'maybe' ? '\u{1F44D}' : '\u{1F64F}'}</div>
                  <h3 style={{ fontSize: 24, fontWeight: 300, marginBottom: 8 }}>Баярлалаа!</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: SANS }}>
                    {rsvpStatus === 'attending' ? 'Таныг хүлээж байна!' : rsvpStatus === 'maybe' ? 'Мэдэгдэхээ мартуузай' : 'Ойлголоо, баярлалаа!'}
                  </p>
                </div>
              )}

              {/* Stats */}
              {stats && stats.attending > 0 && (
                <div style={{ marginTop: 32, textAlign: 'center', fontFamily: SANS }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: accent }}>{stats.total_guest_count || stats.attending}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>зочин ирнэ</div>
                </div>
              )}
            </section>
          )}

          {/* ── VIDEO ── */}
          {inv.video_urls?.length > 0 && (
            <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px' }}>
              <SectionTitle text="Видео" accent={accent} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
                {inv.video_urls.map((url: string, i: number) => (
                  <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${accent}15` }}>
                    <video src={url} controls playsInline preload="metadata"
                      style={{ width: '100%', display: 'block', background: '#000' }} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── GALLERY ── */}
          {inv.gallery_urls?.length > 0 && (
            <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px' }}>
              <SectionTitle text="Зургийн цомог" accent={accent} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 32 }}>
                {inv.gallery_urls.map((url: string, i: number) => (
                  <div key={i} onClick={() => setLightboxImg(url)} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: `1px solid ${accent}10`, cursor: 'pointer' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Lightbox */}
          {lightboxImg && (
            <div onClick={() => setLightboxImg(null)} style={{
              position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 24,
            }}>
              <img src={lightboxImg} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: 32, opacity: 0.7 }}>&times;</div>
            </div>
          )}

          {/* ── FOOTER ── */}
          <footer style={{ textAlign: 'center', padding: '40px 24px 60px', borderTop: `1px solid ${accent}10` }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(${accent}, transparent)`, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontFamily: SANS }}>
              BizPrint Digital Invitation
            </div>
          </footer>
        </div>
      )}

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; }
        ::selection { background: ${accent}40; }
        @keyframes contentReveal { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes growDown { from { height: 0 } to { height: 60px } }
        @keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(8px) } }
        @keyframes countTick { from { transform: scale(1.1) } to { transform: scale(1) } }
        input:focus, textarea:focus { border-color: ${accent}60 !important; }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════
//  COUNTDOWN COMPONENT (live ticking)
// ════════════════════════════════════════════
function CountdownSection({ eventDate, accent }: { eventDate: Date; accent: string }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = eventDate.getTime() - now.getTime()
  if (diff <= 0) return (
    <section style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 32, fontWeight: 300, color: accent }}>Арга хэмжээ эхэлсэн!</div>
    </section>
  )

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  return (
    <section style={{ textAlign: 'center', padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontSize: 13, letterSpacing: 6, color: `${accent}99`, textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif", marginBottom: 32 }}>
        Хүлээгдэж буй
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(12px, 4vw, 32px)' }}>
        <CountUnit value={days} label="Өдөр" accent={accent} />
        <div style={{ fontSize: 32, color: `${accent}40`, fontWeight: 200, alignSelf: 'center', paddingBottom: 24 }}>:</div>
        <CountUnit value={hours} label="Цаг" accent={accent} />
        <div style={{ fontSize: 32, color: `${accent}40`, fontWeight: 200, alignSelf: 'center', paddingBottom: 24 }}>:</div>
        <CountUnit value={minutes} label="Минут" accent={accent} />
        <div style={{ fontSize: 32, color: `${accent}40`, fontWeight: 200, alignSelf: 'center', paddingBottom: 24 }}>:</div>
        <CountUnit value={seconds} label="Секунд" accent={accent} />
      </div>
    </section>
  )
}

function CountUnit({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(28px, 8vw, 48px)', fontWeight: 300, color: '#fff', lineHeight: 1, animation: 'countTick 0.3s ease', fontVariantNumeric: 'tabular-nums' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 11, color: `${accent}80`, letterSpacing: 2, marginTop: 8, textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif" }}>{label}</div>
    </div>
  )
}

// ════════════════════════════════════════════
//  SHARED COMPONENTS
// ════════════════════════════════════════════
function SectionTitle({ text, accent }: { text: string; accent: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 40, height: 1, background: accent, margin: '0 auto 16px', opacity: 0.4 }} />
      <h2 style={{ fontSize: 28, fontWeight: 300, letterSpacing: 2 }}>{text}</h2>
      <div style={{ width: 40, height: 1, background: accent, margin: '16px auto 0', opacity: 0.4 }} />
    </div>
  )
}

function DetailCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}15`, borderRadius: 16, padding: '24px 28px', textAlign: 'left', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: `${accent}80`, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 400 }}>{value}</div>
        {sub && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{sub}</div>}
      </div>
    </div>
  )
}
