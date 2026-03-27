/**
 * 20 Business Card Layout Templates
 * Each template has: front SVG + back SVG + element positions
 * Colors: accent, bg, text — customizable per template
 */

export interface BcTemplate {
  id: string
  name: string
  category: 'minimal' | 'corporate' | 'creative' | 'dark' | 'bold'
  accent: string
  bg: string
  bgBack: string
  textColor: string
  textLight: string
  /** SVG decorator shapes for front */
  frontShapes: string
  /** SVG decorator shapes for back */
  backShapes: string
  /** Element layout positions (front) */
  frontLayout: {
    name: { x: number; y: number; size: number; bold: boolean; color: 'accent' | 'text' }
    title: { x: number; y: number; size: number }
    phone: { x: number; y: number; size: number }
    email: { x: number; y: number; size: number }
    address: { x: number; y: number; size: number }
    website: { x: number; y: number; size: number }
    logo: { x: number; y: number; w: number; h: number }
    company: { x: number; y: number; size: number; bold: boolean }
    qr?: { x: number; y: number; w: number }
  }
  /** Element layout positions (back) */
  backLayout: {
    logo: { x: number; y: number; w: number; h: number }
    company: { x: number; y: number; size: number; bold: boolean; color: 'accent' | 'text' }
    slogan: { x: number; y: number; size: number }
    qr?: { x: number; y: number; w: number }
    social?: { x: number; y: number }
  }
}

const W = 450, H = 275

export const BC_TEMPLATES: BcTemplate[] = [
  // ─── 1. Classic Blue ───
  {
    id: 'classic-blue', name: 'Классик цэнхэр', category: 'corporate',
    accent: '#0EA5E9', bg: '#FFFFFF', bgBack: '#FFFFFF', textColor: '#1E293B', textLight: '#64748B',
    frontShapes: `<rect x="0" y="${H-8}" width="${W}" height="8" fill="#0EA5E9"/>
      <rect x="0" y="${H-14}" width="180" height="6" fill="#1E293B"/>
      <polygon points="${W-120},${H} ${W},${H-80} ${W},${H}" fill="#0EA5E9"/>
      <polygon points="${W-80},${H} ${W},${H-50} ${W},${H}" fill="#0EA5E9" opacity="0.3"/>`,
    backShapes: `<rect x="0" y="${H-8}" width="${W}" height="8" fill="#0EA5E9"/>
      <rect x="0" y="${H-14}" width="180" height="6" fill="#1E293B"/>
      <polygon points="${W-120},${H} ${W},${H-80} ${W},${H}" fill="#0EA5E9"/>`,
    frontLayout: {
      name: { x: 25, y: 40, size: 20, bold: true, color: 'text' },
      title: { x: 25, y: 62, size: 11 },
      phone: { x: 50, y: 110, size: 11 }, email: { x: 50, y: 132, size: 11 },
      address: { x: 50, y: 154, size: 10 }, website: { x: 50, y: 176, size: 10 },
      logo: { x: 280, y: 30, w: 50, h: 50 },
      company: { x: 280, y: 95, size: 14, bold: true },
    },
    backLayout: {
      logo: { x: W/2-30, y: 50, w: 60, h: 60 },
      company: { x: W/2, y: 130, size: 16, bold: true, color: 'text' },
      slogan: { x: W/2, y: 152, size: 11 },
    },
  },
  // ─── 2. Teal Modern ───
  {
    id: 'teal-modern', name: 'Орчин үеийн ногоон', category: 'corporate',
    accent: '#14B8A6', bg: '#FFFFFF', bgBack: '#14B8A6', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<rect x="0" y="0" width="8" height="${H}" fill="#14B8A6"/>
      <rect x="${W-8}" y="0" width="8" height="${H}" fill="#14B8A6"/>
      <rect x="0" y="${H-4}" width="${W}" height="4" fill="#14B8A6"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#14B8A6"/>
      <rect x="20" y="20" width="${W-40}" height="${H-40}" rx="8" fill="white" opacity="0.15"/>`,
    frontLayout: {
      name: { x: 30, y: 160, size: 18, bold: true, color: 'text' },
      title: { x: 30, y: 182, size: 11 },
      phone: { x: 55, y: 210, size: 10 }, email: { x: 200, y: 210, size: 10 },
      address: { x: 55, y: 230, size: 9 }, website: { x: 200, y: 230, size: 9 },
      logo: { x: W/2-30, y: 30, w: 60, h: 50 },
      company: { x: W/2, y: 100, size: 15, bold: true },
      qr: { x: W-100, y: 155, w: 70 },
    },
    backLayout: {
      logo: { x: W/2-35, y: 60, w: 70, h: 60 },
      company: { x: W/2, y: 145, size: 18, bold: true, color: 'text' },
      slogan: { x: W/2, y: 170, size: 12 },
    },
  },
  // ─── 3. Navy Gold ───
  {
    id: 'navy-gold', name: 'Хар хөх алтан', category: 'bold',
    accent: '#F59E0B', bg: '#FFFFFF', bgBack: '#1E293B', textColor: '#1E293B', textLight: '#64748B',
    frontShapes: `<path d="M0,0 L${W},0 L${W},40 Q${W/2},60 0,40Z" fill="#1E293B"/>
      <path d="M0,${H} L180,${H} L160,${H-20} L0,${H-20}Z" fill="#F59E0B"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#1E293B"/>
      <rect x="${W-100}" y="${H-100}" width="100" height="100" fill="#F59E0B" opacity="0.15"/>
      <rect x="${W-80}" y="${H-80}" width="80" height="80" fill="#F59E0B" opacity="0.1"/>`,
    frontLayout: {
      name: { x: 25, y: 80, size: 20, bold: true, color: 'text' },
      title: { x: 25, y: 104, size: 11 },
      phone: { x: 50, y: 140, size: 11 }, email: { x: 50, y: 162, size: 11 },
      address: { x: 50, y: 184, size: 10 }, website: { x: 50, y: 206, size: 10 },
      logo: { x: 320, y: 70, w: 55, h: 55 },
      company: { x: 320, y: 140, size: 13, bold: true },
    },
    backLayout: {
      logo: { x: W/2-30, y: 60, w: 60, h: 60 },
      company: { x: W/2, y: 145, size: 16, bold: true, color: 'accent' },
      slogan: { x: W/2, y: 170, size: 11 },
    },
  },
  // ─── 4. Dark Orange ───
  {
    id: 'dark-orange', name: 'Хар улбар шар', category: 'dark',
    accent: '#FF6B00', bg: '#111111', bgBack: '#111111', textColor: '#F1F5F9', textLight: '#94A3B8',
    frontShapes: `<circle cx="${W-60}" cy="60" r="80" fill="#FF6B00" opacity="0.15"/>
      <circle cx="${W-40}" cy="80" r="50" fill="#FF6B00" opacity="0.1"/>
      <rect x="0" y="${H-3}" width="${W}" height="3" fill="#FF6B00"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#111"/>
      <circle cx="${W/2}" cy="${H/2}" r="90" fill="#FF6B00" opacity="0.08"/>
      <circle cx="${W/2}" cy="${H/2}" r="60" fill="#FF6B00" opacity="0.06"/>`,
    frontLayout: {
      name: { x: 25, y: 100, size: 20, bold: true, color: 'accent' },
      title: { x: 25, y: 124, size: 11 },
      phone: { x: 25, y: 170, size: 11 }, email: { x: 25, y: 192, size: 11 },
      address: { x: 25, y: 214, size: 10 }, website: { x: 25, y: 236, size: 10 },
      logo: { x: 320, y: 30, w: 50, h: 50 },
      company: { x: 25, y: 50, size: 13, bold: true },
    },
    backLayout: {
      logo: { x: W/2-35, y: 55, w: 70, h: 70 },
      company: { x: W/2, y: 150, size: 16, bold: true, color: 'accent' },
      slogan: { x: W/2, y: 175, size: 11 },
    },
  },
  // ─── 5. Minimal White ───
  {
    id: 'minimal-white', name: 'Минимал цагаан', category: 'minimal',
    accent: '#111827', bg: '#FFFFFF', bgBack: '#FAFAFA', textColor: '#111827', textLight: '#9CA3AF',
    frontShapes: `<line x1="25" y1="95" x2="120" y2="95" stroke="#111827" stroke-width="2"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#FAFAFA"/>
      <line x1="${W/2-60}" y1="${H/2+30}" x2="${W/2+60}" y2="${H/2+30}" stroke="#D1D5DB" stroke-width="1"/>`,
    frontLayout: {
      name: { x: 25, y: 70, size: 22, bold: true, color: 'text' },
      title: { x: 25, y: 110, size: 11 },
      phone: { x: 25, y: 170, size: 11 }, email: { x: 25, y: 192, size: 11 },
      address: { x: 25, y: 214, size: 10 }, website: { x: 200, y: 170, size: 10 },
      logo: { x: W-90, y: 25, w: 55, h: 55 },
      company: { x: 25, y: 135, size: 12, bold: false },
    },
    backLayout: {
      logo: { x: W/2-25, y: H/2-40, w: 50, h: 50 },
      company: { x: W/2, y: H/2+30, size: 14, bold: true, color: 'text' },
      slogan: { x: W/2, y: H/2+50, size: 10 },
    },
  },
  // ─── 6. Red Bold ───
  {
    id: 'red-bold', name: 'Улаан идэвхтэй', category: 'bold',
    accent: '#DC2626', bg: '#FFFFFF', bgBack: '#DC2626', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<rect x="0" y="0" width="6" height="${H}" fill="#DC2626"/>
      <rect x="0" y="0" width="${W}" height="4" fill="#DC2626"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#DC2626"/>
      <circle cx="${W}" cy="0" r="120" fill="white" opacity="0.06"/>`,
    frontLayout: {
      name: { x: 30, y: 50, size: 20, bold: true, color: 'accent' },
      title: { x: 30, y: 74, size: 11 },
      phone: { x: 55, y: 120, size: 11 }, email: { x: 55, y: 142, size: 11 },
      address: { x: 55, y: 164, size: 10 }, website: { x: 55, y: 186, size: 10 },
      logo: { x: 330, y: 30, w: 50, h: 50 },
      company: { x: 330, y: 95, size: 12, bold: true },
    },
    backLayout: {
      logo: { x: W/2-30, y: 60, w: 60, h: 60 },
      company: { x: W/2, y: 145, size: 16, bold: true, color: 'text' },
      slogan: { x: W/2, y: 168, size: 11 },
    },
  },
  // ─── 7. Purple Creative ───
  {
    id: 'purple-creative', name: 'Нил ягаан бүтээлч', category: 'creative',
    accent: '#8B5CF6', bg: '#FFFFFF', bgBack: '#1E1B4B', textColor: '#1E1B4B', textLight: '#6B7280',
    frontShapes: `<path d="M${W-150},0 L${W},0 L${W},100Z" fill="#8B5CF6" opacity="0.12"/>
      <path d="M${W-80},0 L${W},0 L${W},60Z" fill="#8B5CF6" opacity="0.08"/>
      <rect x="0" y="${H-4}" width="120" height="4" fill="#8B5CF6"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#1E1B4B"/>
      <circle cx="60" cy="${H-40}" r="100" fill="#8B5CF6" opacity="0.12"/>`,
    frontLayout: {
      name: { x: 25, y: 55, size: 20, bold: true, color: 'accent' },
      title: { x: 25, y: 78, size: 11 },
      phone: { x: 25, y: 130, size: 11 }, email: { x: 25, y: 152, size: 11 },
      address: { x: 25, y: 174, size: 10 }, website: { x: 25, y: 196, size: 10 },
      logo: { x: 310, y: 100, w: 55, h: 55 },
      company: { x: 310, y: 170, size: 12, bold: true },
      qr: { x: 330, y: 25, w: 60 },
    },
    backLayout: {
      logo: { x: W/2-30, y: 55, w: 60, h: 60 },
      company: { x: W/2, y: 135, size: 16, bold: true, color: 'accent' },
      slogan: { x: W/2, y: 158, size: 11 },
      social: { x: W/2, y: 200 },
    },
  },
  // ─── 8. Green Nature ───
  {
    id: 'green-nature', name: 'Ногоон байгаль', category: 'creative',
    accent: '#059669', bg: '#FFFFFF', bgBack: '#059669', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<path d="M0,${H} Q80,${H-40} 180,${H}" fill="#059669" opacity="0.1"/>
      <path d="M0,${H} Q40,${H-25} 100,${H}" fill="#059669" opacity="0.15"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#059669"/>
      <path d="M0,0 Q${W/2},40 ${W},0" fill="white" opacity="0.08"/>`,
    frontLayout: {
      name: { x: 25, y: 45, size: 20, bold: true, color: 'text' },
      title: { x: 25, y: 68, size: 11 },
      phone: { x: 50, y: 115, size: 11 }, email: { x: 50, y: 137, size: 11 },
      address: { x: 50, y: 159, size: 10 }, website: { x: 50, y: 181, size: 10 },
      logo: { x: 320, y: 35, w: 55, h: 55 },
      company: { x: 320, y: 105, size: 13, bold: true },
    },
    backLayout: {
      logo: { x: W/2-30, y: 60, w: 60, h: 60 },
      company: { x: W/2, y: 140, size: 16, bold: true, color: 'text' },
      slogan: { x: W/2, y: 163, size: 11 },
    },
  },
  // ─── 9. Gray Corporate ───
  {
    id: 'gray-corp', name: 'Саарал корпорэйт', category: 'corporate',
    accent: '#374151', bg: '#FFFFFF', bgBack: '#374151', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<rect x="${W-100}" y="0" width="100" height="${H}" fill="#374151" opacity="0.04"/>
      <rect x="0" y="0" width="4" height="${H}" fill="#374151"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#374151"/>`,
    frontLayout: {
      name: { x: 25, y: 50, size: 18, bold: true, color: 'text' },
      title: { x: 25, y: 72, size: 11 },
      phone: { x: 25, y: 125, size: 11 }, email: { x: 25, y: 147, size: 11 },
      address: { x: 25, y: 169, size: 10 }, website: { x: 25, y: 191, size: 10 },
      logo: { x: 320, y: 25, w: 50, h: 50 },
      company: { x: 320, y: 90, size: 12, bold: true },
    },
    backLayout: {
      logo: { x: W/2-30, y: 65, w: 60, h: 60 },
      company: { x: W/2, y: 145, size: 16, bold: true, color: 'text' },
      slogan: { x: W/2, y: 168, size: 11 },
    },
  },
  // ─── 10. Gold Premium ───
  {
    id: 'gold-premium', name: 'Алтан дээд зэрэг', category: 'dark',
    accent: '#D4AF37', bg: '#0F0F0F', bgBack: '#0F0F0F', textColor: '#F1F5F9', textLight: '#9CA3AF',
    frontShapes: `<rect x="20" y="20" width="${W-40}" height="${H-40}" rx="4" fill="none" stroke="#D4AF37" stroke-width="0.5" opacity="0.3"/>
      <line x1="25" y1="90" x2="100" y2="90" stroke="#D4AF37" stroke-width="1.5"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#0F0F0F"/>
      <rect x="30" y="30" width="${W-60}" height="${H-60}" rx="4" fill="none" stroke="#D4AF37" stroke-width="0.5" opacity="0.2"/>`,
    frontLayout: {
      name: { x: 30, y: 65, size: 20, bold: true, color: 'accent' },
      title: { x: 30, y: 108, size: 11 },
      phone: { x: 30, y: 150, size: 11 }, email: { x: 30, y: 172, size: 11 },
      address: { x: 30, y: 194, size: 10 }, website: { x: 30, y: 216, size: 10 },
      logo: { x: 330, y: 30, w: 50, h: 50 },
      company: { x: 330, y: 100, size: 12, bold: true },
    },
    backLayout: {
      logo: { x: W/2-30, y: 60, w: 60, h: 60 },
      company: { x: W/2, y: 145, size: 16, bold: true, color: 'accent' },
      slogan: { x: W/2, y: 168, size: 11 },
    },
  },
  // ─── 11-20: More variants ───
  {
    id: 'wave-blue', name: 'Долгион цэнхэр', category: 'creative',
    accent: '#2563EB', bg: '#FFFFFF', bgBack: '#2563EB', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<path d="M0,${H-30} Q${W/4},${H-60} ${W/2},${H-30} T${W},${H-30} L${W},${H} L0,${H}Z" fill="#2563EB" opacity="0.08"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#2563EB"/>
      <path d="M0,50 Q${W/4},20 ${W/2},50 T${W},50 L${W},0 L0,0Z" fill="white" opacity="0.06"/>`,
    frontLayout: { name: { x: 25, y: 45, size: 20, bold: true, color: 'accent' }, title: { x: 25, y: 68, size: 11 }, phone: { x: 50, y: 115, size: 11 }, email: { x: 50, y: 137, size: 11 }, address: { x: 50, y: 159, size: 10 }, website: { x: 50, y: 181, size: 10 }, logo: { x: 320, y: 35, w: 55, h: 55 }, company: { x: 320, y: 105, size: 13, bold: true } },
    backLayout: { logo: { x: W/2-30, y: 55, w: 60, h: 60 }, company: { x: W/2, y: 135, size: 16, bold: true, color: 'text' }, slogan: { x: W/2, y: 158, size: 11 } },
  },
  {
    id: 'sunset-warm', name: 'Шар улбар', category: 'bold',
    accent: '#EA580C', bg: '#FFFFFF', bgBack: '#EA580C', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<path d="M${W},0 L${W},${H} L${W-120},${H}Z" fill="#EA580C" opacity="0.08"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#EA580C"/>`,
    frontLayout: { name: { x: 25, y: 50, size: 20, bold: true, color: 'text' }, title: { x: 25, y: 74, size: 11 }, phone: { x: 50, y: 120, size: 11 }, email: { x: 50, y: 142, size: 11 }, address: { x: 50, y: 164, size: 10 }, website: { x: 50, y: 186, size: 10 }, logo: { x: 315, y: 30, w: 55, h: 55 }, company: { x: 315, y: 100, size: 13, bold: true } },
    backLayout: { logo: { x: W/2-30, y: 60, w: 60, h: 60 }, company: { x: W/2, y: 140, size: 16, bold: true, color: 'text' }, slogan: { x: W/2, y: 163, size: 11 } },
  },
  {
    id: 'split-dark', name: 'Хуваасан хар', category: 'dark',
    accent: '#F59E0B', bg: '#FFFFFF', bgBack: '#18181B', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<rect x="0" y="0" width="${W/2-20}" height="${H}" fill="#18181B"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#18181B"/>
      <rect x="${W-120}" y="${H-100}" width="120" height="100" fill="#F59E0B" opacity="0.1"/>`,
    frontLayout: { name: { x: W/2+10, y: 40, size: 18, bold: true, color: 'text' }, title: { x: W/2+10, y: 62, size: 11 }, phone: { x: W/2+10, y: 110, size: 10 }, email: { x: W/2+10, y: 130, size: 10 }, address: { x: W/2+10, y: 150, size: 9 }, website: { x: W/2+10, y: 170, size: 9 }, logo: { x: 40, y: 40, w: 60, h: 60 }, company: { x: 70, y: 130, size: 12, bold: true } },
    backLayout: { logo: { x: W/2-30, y: 60, w: 60, h: 60 }, company: { x: W/2, y: 145, size: 16, bold: true, color: 'accent' }, slogan: { x: W/2, y: 168, size: 11 } },
  },
  {
    id: 'pink-modern', name: 'Ягаан орчин үе', category: 'creative',
    accent: '#EC4899', bg: '#FFFFFF', bgBack: '#EC4899', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<circle cx="${W}" cy="0" r="100" fill="#EC4899" opacity="0.06"/>
      <circle cx="${W-20}" cy="20" r="50" fill="#EC4899" opacity="0.04"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#EC4899"/>`,
    frontLayout: { name: { x: 25, y: 55, size: 20, bold: true, color: 'accent' }, title: { x: 25, y: 78, size: 11 }, phone: { x: 25, y: 130, size: 11 }, email: { x: 25, y: 152, size: 11 }, address: { x: 25, y: 174, size: 10 }, website: { x: 25, y: 196, size: 10 }, logo: { x: 320, y: 40, w: 50, h: 50 }, company: { x: 320, y: 105, size: 12, bold: true } },
    backLayout: { logo: { x: W/2-30, y: 60, w: 60, h: 60 }, company: { x: W/2, y: 140, size: 16, bold: true, color: 'text' }, slogan: { x: W/2, y: 163, size: 11 } },
  },
  {
    id: 'stripe-left', name: 'Зурвас зүүн', category: 'corporate',
    accent: '#0369A1', bg: '#FFFFFF', bgBack: '#0369A1', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<rect x="0" y="0" width="8" height="${H}" fill="#0369A1"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#0369A1"/>`,
    frontLayout: { name: { x: 30, y: 45, size: 20, bold: true, color: 'text' }, title: { x: 30, y: 68, size: 11 }, phone: { x: 55, y: 115, size: 11 }, email: { x: 55, y: 137, size: 11 }, address: { x: 55, y: 159, size: 10 }, website: { x: 55, y: 181, size: 10 }, logo: { x: 330, y: 30, w: 50, h: 50 }, company: { x: 330, y: 95, size: 12, bold: true } },
    backLayout: { logo: { x: W/2-30, y: 60, w: 60, h: 60 }, company: { x: W/2, y: 140, size: 16, bold: true, color: 'text' }, slogan: { x: W/2, y: 163, size: 11 } },
  },
  {
    id: 'diagonal-cut', name: 'Диагональ', category: 'bold',
    accent: '#7C3AED', bg: '#FFFFFF', bgBack: '#7C3AED', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<path d="M0,${H-60} L${W},${H-100} L${W},${H} L0,${H}Z" fill="#7C3AED" opacity="0.06"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#7C3AED"/>
      <path d="M0,0 L${W},0 L${W},80 L0,120Z" fill="white" opacity="0.06"/>`,
    frontLayout: { name: { x: 25, y: 50, size: 20, bold: true, color: 'accent' }, title: { x: 25, y: 74, size: 11 }, phone: { x: 50, y: 120, size: 11 }, email: { x: 50, y: 142, size: 11 }, address: { x: 50, y: 164, size: 10 }, website: { x: 50, y: 186, size: 10 }, logo: { x: 320, y: 35, w: 55, h: 55 }, company: { x: 320, y: 105, size: 13, bold: true } },
    backLayout: { logo: { x: W/2-30, y: 55, w: 60, h: 60 }, company: { x: W/2, y: 135, size: 16, bold: true, color: 'text' }, slogan: { x: W/2, y: 158, size: 11 } },
  },
  {
    id: 'clean-center', name: 'Цэвэр голд', category: 'minimal',
    accent: '#475569', bg: '#FFFFFF', bgBack: '#F8FAFC', textColor: '#111827', textLight: '#94A3B8',
    frontShapes: `<line x1="${W/2-40}" y1="88" x2="${W/2+40}" y2="88" stroke="#CBD5E1" stroke-width="1"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#F8FAFC"/>`,
    frontLayout: { name: { x: W/2, y: 60, size: 22, bold: true, color: 'text' }, title: { x: W/2, y: 105, size: 11 }, phone: { x: W/2, y: 150, size: 11 }, email: { x: W/2, y: 172, size: 11 }, address: { x: W/2, y: 194, size: 10 }, website: { x: W/2, y: 216, size: 10 }, logo: { x: W/2-25, y: 10, w: 50, h: 35 }, company: { x: W/2, y: 125, size: 11, bold: false } },
    backLayout: { logo: { x: W/2-30, y: H/2-35, w: 60, h: 50 }, company: { x: W/2, y: H/2+30, size: 14, bold: true, color: 'text' }, slogan: { x: W/2, y: H/2+50, size: 10 } },
  },
  {
    id: 'corner-accent', name: 'Булан өнгөт', category: 'corporate',
    accent: '#0891B2', bg: '#FFFFFF', bgBack: '#FFFFFF', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<path d="M0,0 L80,0 L0,80Z" fill="#0891B2"/>
      <path d="M${W},${H} L${W-80},${H} L${W},${H-80}Z" fill="#0891B2"/>`,
    backShapes: `<path d="M0,0 L80,0 L0,80Z" fill="#0891B2"/>
      <path d="M${W},${H} L${W-80},${H} L${W},${H-80}Z" fill="#0891B2"/>`,
    frontLayout: { name: { x: 25, y: 105, size: 20, bold: true, color: 'text' }, title: { x: 25, y: 128, size: 11 }, phone: { x: 50, y: 165, size: 11 }, email: { x: 50, y: 187, size: 11 }, address: { x: 50, y: 209, size: 10 }, website: { x: 200, y: 165, size: 10 }, logo: { x: 310, y: 25, w: 50, h: 50 }, company: { x: 310, y: 90, size: 13, bold: true } },
    backLayout: { logo: { x: W/2-30, y: 60, w: 60, h: 60 }, company: { x: W/2, y: 140, size: 16, bold: true, color: 'accent' }, slogan: { x: W/2, y: 163, size: 11 } },
  },
  {
    id: 'mono-dark', name: 'Бүрэн хар', category: 'dark',
    accent: '#E5E7EB', bg: '#18181B', bgBack: '#18181B', textColor: '#F1F5F9', textLight: '#9CA3AF',
    frontShapes: `<line x1="25" y1="88" x2="80" y2="88" stroke="#E5E7EB" stroke-width="2"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#18181B"/>
      <line x1="${W/2-40}" y1="${H/2+20}" x2="${W/2+40}" y2="${H/2+20}" stroke="#333" stroke-width="1"/>`,
    frontLayout: { name: { x: 25, y: 65, size: 20, bold: true, color: 'accent' }, title: { x: 25, y: 105, size: 11 }, phone: { x: 25, y: 155, size: 11 }, email: { x: 25, y: 177, size: 11 }, address: { x: 25, y: 199, size: 10 }, website: { x: 25, y: 221, size: 10 }, logo: { x: 330, y: 30, w: 50, h: 50 }, company: { x: 330, y: 95, size: 12, bold: true } },
    backLayout: { logo: { x: W/2-25, y: H/2-40, w: 50, h: 50 }, company: { x: W/2, y: H/2+25, size: 14, bold: true, color: 'accent' }, slogan: { x: W/2, y: H/2+45, size: 10 } },
  },
  {
    id: 'bizprint-brand', name: 'BizPrint брэнд', category: 'bold',
    accent: '#FF6B00', bg: '#FFFFFF', bgBack: '#FF6B00', textColor: '#111827', textLight: '#6B7280',
    frontShapes: `<rect x="0" y="0" width="${W}" height="5" fill="#FF6B00"/>
      <rect x="0" y="${H-5}" width="${W}" height="5" fill="#FF6B00"/>`,
    backShapes: `<rect width="${W}" height="${H}" fill="#FF6B00"/>
      <circle cx="${W/2}" cy="${H/2}" r="80" fill="white" opacity="0.08"/>`,
    frontLayout: { name: { x: 25, y: 50, size: 20, bold: true, color: 'accent' }, title: { x: 25, y: 74, size: 11 }, phone: { x: 50, y: 120, size: 11 }, email: { x: 50, y: 142, size: 11 }, address: { x: 50, y: 164, size: 10 }, website: { x: 50, y: 186, size: 10 }, logo: { x: 320, y: 35, w: 55, h: 55 }, company: { x: 320, y: 105, size: 13, bold: true } },
    backLayout: { logo: { x: W/2-35, y: 55, w: 70, h: 60 }, company: { x: W/2, y: 140, size: 18, bold: true, color: 'text' }, slogan: { x: W/2, y: 165, size: 12 } },
  },
]

/**
 * Render a business card template as SVG string
 */
export function renderBcSvg(
  template: BcTemplate,
  side: 'front' | 'back',
  data?: { name?: string; title?: string; phone?: string; email?: string; address?: string; website?: string; company?: string; slogan?: string }
): string {
  const d = data || {}
  const bg = side === 'front' ? template.bg : template.bgBack
  const shapes = side === 'front' ? template.frontShapes : template.backShapes
  const tc = side === 'back' && (template.bgBack !== '#FFFFFF' && template.bgBack !== '#FAFAFA' && template.bgBack !== '#F8FAFC') ? '#FFFFFF' : template.textColor
  const tl = side === 'back' && (template.bgBack !== '#FFFFFF' && template.bgBack !== '#FAFAFA' && template.bgBack !== '#F8FAFC') ? 'rgba(255,255,255,0.7)' : template.textLight

  if (side === 'front') {
    const fl = template.frontLayout
    const nc = fl.name.color === 'accent' ? template.accent : tc
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 275" width="450" height="275">
      <rect width="450" height="275" fill="${bg}" rx="6"/>
      ${shapes}
      <rect x="${fl.logo.x}" y="${fl.logo.y}" width="${fl.logo.w}" height="${fl.logo.h}" rx="6" fill="${template.accent}" opacity="0.15"/>
      <text x="${fl.logo.x + fl.logo.w/2}" y="${fl.logo.y + fl.logo.h/2 + 4}" text-anchor="middle" font-size="9" fill="${template.accent}" font-weight="600">ЛОГО</text>
      <text x="${fl.name.x}" y="${fl.name.y}" font-size="${fl.name.size}" font-weight="${fl.name.bold ? 700 : 400}" fill="${nc}">${d.name || 'Овог Нэр'}</text>
      <text x="${fl.title.x}" y="${fl.title.y}" font-size="${fl.title.size}" fill="${tl}">${d.title || 'Албан тушаал'}</text>
      <text x="${fl.company.x}" y="${fl.company.y}" font-size="${fl.company.size}" font-weight="${fl.company.bold ? 700 : 400}" fill="${template.accent}">${d.company || 'Компани нэр'}</text>
      <text x="${fl.phone.x}" y="${fl.phone.y}" font-size="${fl.phone.size}" fill="${tl}">☎ ${d.phone || '+976 0000 0000'}</text>
      <text x="${fl.email.x}" y="${fl.email.y}" font-size="${fl.email.size}" fill="${tl}">✉ ${d.email || 'email@mail.mn'}</text>
      <text x="${fl.address.x}" y="${fl.address.y}" font-size="${fl.address.size}" fill="${tl}">📍 ${d.address || 'Хаяг'}</text>
      <text x="${fl.website.x}" y="${fl.website.y}" font-size="${fl.website.size}" fill="${tl}">🌐 ${d.website || 'www.site.mn'}</text>
      ${fl.qr ? `<rect x="${fl.qr.x}" y="${fl.qr.y}" width="${fl.qr.w}" height="${fl.qr.w}" rx="4" fill="white" stroke="#ddd" stroke-width="1"/><text x="${fl.qr.x + fl.qr.w/2}" y="${fl.qr.y + fl.qr.w/2 + 4}" text-anchor="middle" font-size="10" fill="#999">QR</text>` : ''}
    </svg>`
  } else {
    const bl = template.backLayout
    const cc = bl.company.color === 'accent' ? template.accent : tc
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 275" width="450" height="275">
      <rect width="450" height="275" fill="${bg}" rx="6"/>
      ${shapes}
      <rect x="${bl.logo.x}" y="${bl.logo.y}" width="${bl.logo.w}" height="${bl.logo.h}" rx="8" fill="${template.accent}" opacity="0.2"/>
      <text x="${bl.logo.x + bl.logo.w/2}" y="${bl.logo.y + bl.logo.h/2 + 5}" text-anchor="middle" font-size="11" fill="${template.accent}" font-weight="700">ЛОГО</text>
      <text x="${bl.company.x}" y="${bl.company.y}" text-anchor="middle" font-size="${bl.company.size}" font-weight="${bl.company.bold ? 700 : 400}" fill="${cc}">${d.company || 'Компани нэр'}</text>
      <text x="${bl.slogan.x}" y="${bl.slogan.y}" text-anchor="middle" font-size="${bl.slogan.size}" fill="${tl}">${d.slogan || 'Таны уриа'}</text>
      ${bl.qr ? `<rect x="${bl.qr.x}" y="${bl.qr.y}" width="${bl.qr.w}" height="${bl.qr.w}" rx="4" fill="white" stroke="${tl}" stroke-width="0.5" opacity="0.8"/><text x="${bl.qr.x + bl.qr.w/2}" y="${bl.qr.y + bl.qr.w/2 + 4}" text-anchor="middle" font-size="10" fill="#999">QR</text>` : ''}
      ${bl.social ? `<text x="${bl.social.x}" y="${bl.social.y}" text-anchor="middle" font-size="11" fill="${tl}">f  ig  in</text>` : ''}
    </svg>`
  }
}
