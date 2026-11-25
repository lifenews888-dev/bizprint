'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { brand, siteNav } from './content'
import { EASE, OrangeButton, RollText, useUbTime } from './primitives'

type NavUser = { full_name?: string; name?: string; email?: string }

const noopSubscribe = () => () => {}

/** localStorage-аас хэрэглэгчийг SSR-д аюулгүйгээр уншина */
function useNavUser(): NavUser | null {
  const raw = useSyncExternalStore(
    noopSubscribe,
    () => localStorage.getItem('user') || '',
    () => '',
  )
  try {
    return raw ? (JSON.parse(raw) as NavUser) : null
  } catch {
    return null
  }
}

/** Шинэ загварын цэс: pill nav + хайлт + сагс + нэвтрэх + гар утасны sheet */
export default function SiteNav() {
  const time = useUbTime()
  const user = useNavUser()
  const cartCount = useStore((s) => s.cart.reduce((n, c) => n + c.qty, 0))
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const accountHref = user ? '/dashboard/customer' : '/login'
  const accountLabel = user ? user.full_name || user.name || 'Миний бүртгэл' : 'Нэвтрэх'
  const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-full text-gray-900 transition-colors duration-300 hover:bg-gray-100'

  return (
    <>
      <header className="relative z-20 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <nav className="flex items-center justify-between rounded-full bg-white p-[5px]" aria-label="Үндсэн цэс">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold tracking-tight text-white sm:h-10 sm:w-10 sm:text-[11px]" aria-label={brand.name}>
              {brand.short}
            </Link>
            <ul className="hidden items-center gap-6 lg:flex">
              {siteNav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-[14px] text-gray-900 transition-colors duration-300 hover:text-gray-500">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <span className="mr-2 hidden items-center gap-1.5 text-[13px] text-gray-600 xl:flex">
              <Clock size={14} /> {time} · Улаанбаатар
            </span>
            <a href="/search" className={iconBtn} aria-label="Хайх">
              <Search size={17} />
            </a>
            <a href={accountHref} className={`${iconBtn} hidden md:flex`} aria-label={accountLabel} title={accountLabel}>
              <User size={17} />
            </a>
            <a href="/cart" className={`${iconBtn} relative`} aria-label="Сагс">
              <ShoppingBag size={17} />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#FF6B00] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </a>
            <a href="/quote" className="group ml-1 hidden items-center gap-3 rounded-full bg-gray-900 py-2 pl-5 pr-2 text-[13px] font-medium text-white md:flex">
              <RollText>Үнийн санал авах</RollText>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                <ArrowRight size={13} className={`text-gray-900 transition-transform duration-500 ${EASE} group-hover:-rotate-45`} />
              </span>
            </a>
            <button onClick={() => setOpen(true)} className="ml-1 flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white lg:hidden" aria-expanded={open}>
              <Menu size={15} /> Цэс
            </button>
          </div>
        </nav>
      </header>

      <div className={`fixed inset-0 z-[2100] lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-x-0 bottom-0 mx-3 mb-3 rounded-2xl bg-white p-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-y-0' : 'translate-y-[110%]'}`}>
          <div className="mb-6 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] text-gray-600">
              <Clock size={13} /> {time} · Улаанбаатар
            </span>
            <button onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white">
              <X size={15} /> Хаах
            </button>
          </div>
          <ul className="mb-6 space-y-1">
            {siteNav.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)} className="block py-1 text-[28px] font-medium leading-tight text-gray-900">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href={accountHref} className="block py-1 text-[28px] font-medium leading-tight text-gray-900">
                {accountLabel}
              </a>
            </li>
          </ul>
          <OrangeButton href="/quote">Үнийн санал авах</OrangeButton>
        </div>
      </div>
    </>
  )
}
