'use client'

import { Component, useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight } from 'lucide-react'
import './site.css'

export const EASE = 'ease-[cubic-bezier(0.25,0.1,0.25,1)]'
export const ORANGE = '#FF6B00' // BizPrint брэнд өнгө
export const HeroShader = dynamic(() => import('./HeroShader'), { ssr: false })

/* ---------- жижиг туслах компонентууд ---------- */

/** Фоны shader ачаалагдахгүй / WebGPU байхгүй үед хуудсыг унагахгүй */
export class SafeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function useUbTime() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ulaanbaatar',
    }).format(new Date())
  const [time, setTime] = useState('--:--')
  useEffect(() => {
    const first = setTimeout(() => setTime(fmt()), 0)
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])
  return time
}

export function RollText({ children, h = 'h-[20px]' }: { children: ReactNode; h?: string }) {
  return (
    <span className={`relative flex flex-col overflow-hidden ${h}`}>
      <span className={`flex flex-col transition-transform duration-500 ${EASE} group-hover:-translate-y-1/2`}>
        <span className={`${h} flex items-center leading-none`}>{children}</span>
        <span className={`${h} flex items-center leading-none`} aria-hidden>
          {children}
        </span>
      </span>
    </span>
  )
}

export function OrangeButton({ href, children, size = 'lg' }: { href: string; children: ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <a
      href={href}
      style={{ backgroundColor: ORANGE }}
      className="group inline-flex w-fit items-center gap-3 rounded-full py-2 pl-5 pr-2 text-[13px] text-white transition-[filter] duration-300 hover:brightness-95 sm:pl-6 sm:text-[14px]"
    >
      <RollText>{children}</RollText>
      <span
        className={`flex items-center justify-center rounded-full bg-white ${size === 'lg' ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-6 w-6'}`}
      >
        <ArrowRight size={size === 'lg' ? 15 : 13} style={{ color: ORANGE }} className={`transition-transform duration-500 ${EASE} group-hover:-rotate-45`} />
      </span>
    </a>
  )
}

/** Зураг байхгүй бол брэнд өнгөтэй орлуулагч харуулна */
export function ImageSlot({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className={`relative flex items-start overflow-hidden bg-gradient-to-br from-[#FF6B00] via-[#ff8a3d] to-[#7c3aed] p-4 ${className}`}>
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-900">{alt}</span>
      </div>
    )
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

export function Badge({ n, label, border = 'border-gray-200' }: { n: string; label: string; border?: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 px-5 sm:mb-8 sm:px-8 lg:px-12">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[12px]">
        {n}
      </span>
      <span className={`rounded-full border ${border} px-3 py-1 text-[12px] font-medium text-gray-900 sm:px-4 sm:py-1.5 sm:text-[13px]`}>
        {label}
      </span>
    </div>
  )
}

export function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i}>
          {l}
          {i < lines.length - 1 && (
            <>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
            </>
          )}
        </span>
      ))}
    </>
  )
}

export function Starburst({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  )
}




/** Цагаан хоёрдогч товч (hero дээрх "Үнэ тооцоолох" г.м.) */
export function WhiteButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex w-fit items-center gap-3 rounded-full bg-white py-2 pl-5 pr-2 text-[13px] font-medium text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:pl-6 sm:text-[14px]"
    >
      <RollText>{children}</RollText>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 sm:h-8 sm:w-8">
        <ArrowRight size={15} className={`text-white transition-transform duration-500 ${EASE} group-hover:-rotate-45`} />
      </span>
    </a>
  )
}
