'use client';

import Link from 'next/link';
import { useState } from 'react';

const SERVICES = [
  {
    id: 'print',
    icon: '🖨️',
    title: 'Хэвлэл захиалах',
    desc: 'PDF, зураг файлаа оруулж хэвлүүлнэ. AI автоматаар тохиромжтой үйлдвэрт хуваарилна.',
    href: '/quote',
    color: '#FF6B00',
    tag: 'Хамгийн их',
    features: ['PDF файл оруулах', 'AI үнийн тооцоо', 'Олон үйлдвэр харьцуулах'],
  },
  {
    id: 'shop',
    icon: '🛒',
    title: 'Дэлгүүрээс сонгох',
    desc: 'Бэлэн бүтээгдэхүүнээс сонгоод шууд сагсандаа нэмнэ. Визит, флаер, стикер, баннер.',
    href: '/shop',
    color: '#8B5CF6',
    tag: '',
    features: ['Бэлэн бүтээгдэхүүн', 'Шууд захиалах', 'Хямд үнэ'],
  },
  {
    id: 'instant',
    icon: '🤖',
    title: 'Шууд үнэ мэдэх',
    desc: 'Бүтээгдэхүүн, тираж сонгоод 10 секундэд үнэ мэдэгдэнэ. Бүртгэл шаардлагагүй.',
    href: '/quote/instant',
    color: '#3B82F6',
    tag: 'AI',
    features: ['10 секундэд үнэ', 'Бүртгэлгүй', 'Задаргаатай'],
  },
  {
    id: 'design',
    icon: '🎨',
    title: 'Дизайн захиалах',
    desc: 'Мэргэжлийн дизайнераар дизайн хийлгэнэ. Логo, брэндинг, сурталчилгааны материал.',
    href: '/marketplace',
    color: '#EC4899',
    tag: 'Creator',
    features: ['Мэргэжлийн дизайнер', 'Портфолио харах', 'Шууд чат'],
  },
  {
    id: 'template',
    icon: '🎭',
    title: 'Загвар ашиглах',
    desc: 'Бэлэн загвараас сонгоод мэдээллээ оруулна. Дизайн мэдэхгүй ч болно.',
    href: '/templates',
    color: '#10B981',
    tag: '',
    features: ['100+ бэлэн загвар', 'Онлайн засварлах', 'Шууд хэвлүүлэх'],
  },
  {
    id: 'bizcard',
    icon: '💳',
    title: 'Нэрийн хуудас',
    desc: 'Нэр, утас, и-мэйл оруулаад шууд захиалаарай. QR код автоматаар үүснэ.',
    href: '/business-cards',
    color: '#F59E0B',
    tag: '3 алхам',
    features: ['Мэдээлэл оруулах', 'Загвар сонгох', 'QR код'],
  },
];

const QUICK_LINKS = [
  { label: 'Баннер', href: '/shop?cat=banner', icon: '🏗️' },
  { label: 'Стикер', href: '/shop?cat=sticker', icon: '📎' },
  { label: 'Ном & Каталог', href: '/shop?cat=book', icon: '📕' },
  { label: 'Флаер & Постер', href: '/shop?cat=flyer', icon: '📄' },
  { label: 'Сав баглаа', href: '/shop?cat=packaging', icon: '📦' },
  { label: 'QR Нэрийн хуудас', href: '/dashboard/customer/digital-card', icon: '📱' },
  { label: 'Smart Quote', href: '/smart-quote', icon: '🧠' },
  { label: 'Үнэ харьцуулах', href: '/quote/compare', icon: '📊' },
];

export default function StartPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* Background accents */}
      <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,107,0,0.04), transparent)' }} />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.03), transparent)' }} />

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(255,107,0,0.06)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.1)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            BizPrint
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--text)' }}>
            Юу хэвлүүлэх вэ?
          </h1>
          <p className="text-sm md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text3)' }}>
            Өөрт хэрэгтэй үйлчилгээгээ сонгоод эхлээрэй
          </p>
        </div>

        {/* Main service cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-12">
          {SERVICES.map(s => (
            <Link key={s.id} href={s.href} className="no-underline group"
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}>
              <div className="relative rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${hoveredId === s.id ? s.color + '40' : 'var(--border)'}`,
                }}>
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${s.color}08, transparent 70%)` }} />

                {/* Tag */}
                {s.tag && (
                  <span className="absolute top-4 right-4 text-[9px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: s.color + '12', color: s.color }}>
                    {s.tag}
                  </span>
                )}

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                  style={{ background: s.color + '10' }}>
                  {s.icon}
                </div>

                {/* Content */}
                <h3 className="text-base md:text-lg font-bold mb-2 group-hover:text-[#FF6B00] transition-colors" style={{ color: 'var(--text)' }}>
                  {s.title}
                </h3>
                <p className="text-xs md:text-sm leading-relaxed mb-4" style={{ color: 'var(--text3)' }}>
                  {s.desc}
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.features.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                      {f}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: s.color }}>
                  Эхлэх
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    className="group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text4)' }}>Эсвэл шууд үзэх</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap justify-center gap-2.5 md:gap-3 mb-14">
          {QUICK_LINKS.map(q => (
            <Link key={q.label} href={q.href}
              className="no-underline flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[#FF6B00]/30"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              <span>{q.icon}</span>
              {q.label}
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center rounded-2xl p-8 md:p-10 relative overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B00]/20 to-transparent" />
          <h2 className="text-lg md:text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Мэдэхгүй байна уу?
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text3)' }}>
            AI туслагчаас асуугаарай — ямар бүтээгдэхүүн, хэмжээ, тоо хэрэгтэйг зөвлөнө
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/smart-quote"
              className="no-underline px-6 py-3 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#FF6B00' }}>
              AI-аас зөвлөгөө авах
            </Link>
            <Link href="/"
              className="no-underline px-6 py-3 rounded-xl text-sm font-medium hover:bg-[var(--surface2)] transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
              Нүүр хуудас руу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
