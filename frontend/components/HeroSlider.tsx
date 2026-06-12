'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Slide {
  id: string; title: string; subtitle?: string; image_url?: string; video_url?: string
  overlay?: string; cta_text?: string; cta_url?: string; cta_style?: string
  cta2_text?: string; cta2_url?: string; position?: string; tag?: string
}

const positionClasses: Record<string, string> = {
  'left': 'items-start justify-center',
  'center': 'items-center justify-center text-center',
  'right': 'items-end justify-center text-right',
  'bottom-left': 'items-start justify-end',
  'bottom-center': 'items-center justify-end text-center',
  'bottom-right': 'items-end justify-end text-right',
}

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const next = useCallback(() => setCurrent(p => (p + 1) % slides.length), [slides.length])

  useEffect(() => {
    const loadedTimer = window.setTimeout(() => setLoaded(true), 0)
    if (slides.length <= 1) return () => window.clearTimeout(loadedTimer)

    const t = window.setInterval(next, 6000)
    return () => {
      window.clearTimeout(loadedTimer)
      window.clearInterval(t)
    }
  }, [slides.length, next])

  if (!slides.length) return null

  return (
    <div className="relative w-full h-[280px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[680px] overflow-hidden">
      {slides.map((slide, i) => {
        const active = i === current
        const pos = positionClasses[slide.position || 'center'] || positionClasses.center

        return (
          <div key={slide.id} className={cn('absolute inset-0 transition-all duration-700', active ? 'opacity-100 z-10' : 'opacity-0 z-0')}>
            {/* Background */}
            {slide.video_url ? (
              <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
                <source src={slide.video_url} type="video/mp4" />
              </video>
            ) : slide.image_url ? (
              <img src={slide.image_url} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00] to-[#F59E0B]" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0" style={{ background: slide.overlay || 'rgba(0,0,0,0.3)' }} />

            {/* Content */}
            <div className={cn('absolute inset-0 flex flex-col p-8 md:p-16 lg:p-24 z-10', pos)}>
              <div className={cn('max-w-xl transition-all duration-700 delay-200', active && loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0')}>
                {slide.tag && (
                  <div className="text-[11px] md:text-xs font-bold text-white/70 uppercase tracking-[0.2em] mb-3" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>{slide.tag}</div>
                )}
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-4 tracking-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-sm md:text-lg lg:text-xl text-white/80 leading-relaxed mb-8" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{slide.subtitle}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  {slide.cta_text && (
                    <a href={slide.cta_url || '#'} className={cn('px-8 md:px-10 py-3.5 md:py-4 rounded-xl text-sm md:text-base font-bold no-underline transition-all hover:scale-105 shadow-lg',
                      slide.cta_style === 'outline' ? 'border-2 border-white/60 text-white hover:bg-white/10' :
                      slide.cta_style === 'ghost' ? 'text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm' :
                      'bg-white text-[#FF6B00] hover:bg-gray-50'
                    )}>
                      {slide.cta_text}
                    </a>
                  )}
                  {slide.cta2_text && (
                    <a href={slide.cta2_url || '#'} className="px-8 md:px-10 py-3.5 md:py-4 rounded-xl text-sm md:text-base font-semibold border-2 border-white/30 text-white no-underline transition-all hover:bg-white/10 backdrop-blur-sm">
                      {slide.cta2_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={cn('rounded-full border-none cursor-pointer transition-all',
                i === current ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
              )} />
          ))}
        </div>
      )}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => setCurrent(p => (p - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white border-none cursor-pointer flex items-center justify-center transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white border-none cursor-pointer flex items-center justify-center transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </>
      )}
    </div>
  )
}
