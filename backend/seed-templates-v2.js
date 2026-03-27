const { DataSource } = require('typeorm');
const ds = new DataSource({ type: 'postgres', host: 'localhost', port: 5432, username: 'postgres', password: 'postgres', database: 'bizprint' });

// Canvas: 450x275 (SCALE=5, 90x55mm). Safe area: 25px (5mm)
const S = 25, W = 450, H = 275, R = W - S, B = H - S, CX = W / 2;

const templates = [
  // ── 1. CLASSIC LEFT ──
  {
    title: 'Classic Left', title_mn: 'Классик зүүн',
    accent: '#FF6B00', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'back',
    front: [
      { key: 'logo', type: 'image', x: S, y: S, w: 64, h: 64 },
      { key: 'company_name', type: 'text', x: S + 76, y: S + 12, w: 200, h: 20, fontSize: 13, fontWeight: 'bold', fill: 'accent' },
      { key: 'company_message', type: 'text', x: S + 76, y: S + 34, w: 200, h: 14, fontSize: 9, fill: 'light' },
      { key: 'full_name', type: 'text', x: S, y: 112, w: 260, h: 28, fontSize: 20, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: S, y: 144, w: 260, h: 16, fontSize: 11, fill: 'light' },
    ],
    back: [
      { key: 'logo', type: 'image', x: S, y: S, w: 48, h: 48 },
      { key: 'company_name', type: 'text', x: S + 56, y: S + 8, w: 160, h: 16, fontSize: 11, fontWeight: 'bold', fill: 'accent' },
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S, y: 92, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 20, y: 92, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: S, y: 112, w: 12, h: 12 },
      { key: 'email', type: 'text', x: S + 20, y: 112, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S, y: 132, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 20, y: 132, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'address1', type: 'text', x: S, y: 160, w: 200, h: 12, fontSize: 8, fill: 'light' },
      { key: 'qr', type: 'qr', x: R - 96, y: S, w: 96, h: 96 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: R - 88, y: B - 24, w: 16, h: 16 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: R - 64, y: B - 24, w: 16, h: 16 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: R - 40, y: B - 24, w: 16, h: 16 },
    ],
  },
  // ── 2. CENTER MINIMAL ──
  {
    title: 'Center Minimal', title_mn: 'Голд минимал',
    accent: '#1E40AF', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'back',
    front: [
      { key: 'logo', type: 'image', x: CX - 28, y: S, w: 56, h: 48 },
      { key: 'full_name', type: 'text', x: CX, y: S + 60, w: 320, h: 28, fontSize: 20, fontWeight: 'bold', fill: 'accent', align: 'center' },
      { key: 'job_title', type: 'text', x: CX, y: S + 92, w: 280, h: 16, fontSize: 11, fill: 'light', align: 'center' },
      { key: 'company_name', type: 'text', x: CX, y: S + 112, w: 280, h: 16, fontSize: 11, fill: 'light', align: 'center' },
    ],
    back: [
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S + 40, y: S + 20, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 58, y: S + 20, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: S + 40, y: S + 40, w: 12, h: 12 },
      { key: 'email', type: 'text', x: S + 58, y: S + 40, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S + 40, y: S + 60, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 58, y: S + 60, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'address1', type: 'text', x: CX, y: B - 20, w: 300, h: 12, fontSize: 8, fill: 'light', align: 'center' },
      { key: 'qr', type: 'qr', x: R - 88, y: S + 12, w: 80, h: 80 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: CX - 28, y: B - 44, w: 14, h: 14 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: CX - 8, y: B - 44, w: 14, h: 14 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: CX + 12, y: B - 44, w: 14, h: 14 },
    ],
  },
  // ── 3. SPLIT CORPORATE ──
  {
    title: 'Split Corporate', title_mn: 'Корпорат хуваасан',
    accent: '#059669', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'back',
    front: [
      { key: 'logo', type: 'image', x: S, y: S, w: 56, h: 56 },
      { key: 'company_name', type: 'text', x: S + 68, y: S + 8, w: 200, h: 20, fontSize: 14, fontWeight: 'bold', fill: 'accent' },
      { key: 'company_message', type: 'text', x: S + 68, y: S + 30, w: 200, h: 14, fontSize: 9, fill: 'light' },
      { key: 'full_name', type: 'text', x: S, y: 120, w: 260, h: 28, fontSize: 19, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: S, y: 150, w: 260, h: 16, fontSize: 11, fill: 'light' },
    ],
    back: [
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S, y: S, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 18, y: S, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: S, y: S + 24, w: 12, h: 12 },
      { key: 'email', type: 'text', x: S + 18, y: S + 24, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S, y: S + 48, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 18, y: S + 48, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'address1', type: 'text', x: S, y: S + 76, w: 200, h: 12, fontSize: 8, fill: 'light' },
      { key: 'qr', type: 'qr', x: R - 96, y: CX / 2 - 48, w: 96, h: 96 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: S, y: B - 24, w: 16, h: 16 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: S + 24, y: B - 24, w: 16, h: 16 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: S + 48, y: B - 24, w: 16, h: 16 },
    ],
  },
  // ── 4. QR FOCUS ──
  {
    title: 'QR Focus', title_mn: 'QR төвт',
    accent: '#0EA5E9', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'both',
    front: [
      { key: 'full_name', type: 'text', x: S, y: S, w: 260, h: 28, fontSize: 20, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: S, y: S + 32, w: 220, h: 16, fontSize: 11, fill: 'light' },
      { key: 'company_name', type: 'text', x: S, y: S + 52, w: 220, h: 16, fontSize: 11, fill: 'light' },
      { key: 'logo', type: 'image', x: S, y: B - 48, w: 44, h: 44 },
    ],
    back: [
      { key: 'qr', type: 'qr', x: S + 16, y: S + 16, w: 120, h: 120 },
      { key: 'full_name', type: 'text', x: 180, y: S + 8, w: 220, h: 20, fontSize: 14, fontWeight: 'bold', fill: 'accent' },
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: 180, y: S + 40, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: 198, y: S + 40, w: 180, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: 180, y: S + 60, w: 12, h: 12 },
      { key: 'email', type: 'text', x: 198, y: S + 60, w: 180, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: 180, y: S + 80, w: 12, h: 12 },
      { key: 'website', type: 'text', x: 198, y: S + 80, w: 180, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: S + 28, y: B - 28, w: 16, h: 16 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: S + 52, y: B - 28, w: 16, h: 16 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: S + 76, y: B - 28, w: 16, h: 16 },
    ],
  },
  // ── 5. MODERN CARD ──
  {
    title: 'Modern Card', title_mn: 'Орчин үеийн',
    accent: '#7C3AED', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'back',
    front: [
      { key: 'full_name', type: 'text', x: S, y: S, w: 320, h: 32, fontSize: 24, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: S, y: S + 36, w: 260, h: 16, fontSize: 11, fill: 'light' },
      { key: 'company_name', type: 'text', x: S, y: S + 56, w: 260, h: 16, fontSize: 11, fill: 'light' },
      { key: 'logo', type: 'image', x: R - 56, y: B - 56, w: 52, h: 52 },
    ],
    back: [
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S, y: S, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 18, y: S, w: 180, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: S, y: S + 24, w: 12, h: 12 },
      { key: 'email', type: 'text', x: S + 18, y: S + 24, w: 180, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S, y: S + 48, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 18, y: S + 48, w: 180, h: 14, fontSize: 10, fill: 'light' },
      { key: 'address1', type: 'text', x: S, y: S + 76, w: 200, h: 12, fontSize: 8, fill: 'light' },
      { key: 'qr', type: 'qr', x: R - 88, y: S, w: 88, h: 88 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: S, y: B - 24, w: 16, h: 16 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: S + 24, y: B - 24, w: 16, h: 16 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: S + 48, y: B - 24, w: 16, h: 16 },
    ],
  },
  // ── 6. MINIMAL PREMIUM ──
  {
    title: 'Minimal Premium', title_mn: 'Минимал премиум',
    accent: '#D4AF37', bg: '#111111', textDark: '#FFFFFF', textLight: '#9CA3AF',
    social_placement: 'back',
    front: [
      { key: 'full_name', type: 'text', x: CX, y: H / 2 - 20, w: 320, h: 32, fontSize: 22, fontWeight: 'bold', fill: 'accent', align: 'center' },
      { key: 'job_title', type: 'text', x: CX, y: H / 2 + 16, w: 280, h: 16, fontSize: 10, fill: 'light', align: 'center' },
    ],
    back: [
      { key: 'logo', type: 'image', x: CX - 28, y: S, w: 56, h: 44 },
      { key: 'company_name', type: 'text', x: CX, y: S + 52, w: 280, h: 16, fontSize: 11, fontWeight: 'bold', fill: 'accent', align: 'center' },
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S + 40, y: 100, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 58, y: 100, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: S + 40, y: 120, w: 12, h: 12 },
      { key: 'email', type: 'text', x: S + 58, y: 120, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S + 40, y: 140, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 58, y: 140, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'qr', type: 'qr', x: R - 80, y: 96, w: 72, h: 72 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: CX - 28, y: B - 28, w: 14, h: 14 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: CX - 8, y: B - 28, w: 14, h: 14 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: CX + 12, y: B - 28, w: 14, h: 14 },
    ],
  },
  // ── 7. HORIZONTAL FLOW ──
  {
    title: 'Horizontal Flow', title_mn: 'Хэвтээ урсгал',
    accent: '#DC2626', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'back',
    front: [
      { key: 'logo', type: 'image', x: S, y: S, w: 48, h: 48 },
      { key: 'full_name', type: 'text', x: S + 60, y: S, w: 240, h: 24, fontSize: 18, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: S + 60, y: S + 28, w: 240, h: 16, fontSize: 10, fill: 'light' },
      { key: 'company_name', type: 'text', x: R, y: S + 4, w: 140, h: 14, fontSize: 10, fill: 'light', align: 'right' },
    ],
    back: [
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S, y: S, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 18, y: S, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: CX, y: S, w: 12, h: 12 },
      { key: 'email', type: 'text', x: CX + 18, y: S, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S, y: S + 24, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 18, y: S + 24, w: 140, h: 14, fontSize: 10, fill: 'light' },
      { key: 'address1', type: 'text', x: CX, y: S + 24, w: 200, h: 12, fontSize: 8, fill: 'light' },
      { key: 'qr', type: 'qr', x: CX - 48, y: 80, w: 96, h: 96 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: R - 64, y: B - 24, w: 16, h: 16 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: R - 40, y: B - 24, w: 16, h: 16 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: R - 16, y: B - 24, w: 16, h: 16 },
    ],
  },
  // ── 8. ICON DRIVEN ──
  {
    title: 'Icon Driven', title_mn: 'Icon голлосон',
    accent: '#0D9488', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'front',
    front: [
      { key: 'logo', type: 'image', x: S, y: S, w: 52, h: 52 },
      { key: 'full_name', type: 'text', x: S + 64, y: S + 4, w: 220, h: 22, fontSize: 16, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: S + 64, y: S + 28, w: 220, h: 14, fontSize: 10, fill: 'light' },
      { key: 'company_name', type: 'text', x: S, y: S + 68, w: 200, h: 14, fontSize: 10, fill: 'light' },
    ],
    back: [
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S, y: S, w: 14, h: 14 },
      { key: 'phone', type: 'text', x: S + 22, y: S + 1, w: 180, h: 14, fontSize: 11, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: S, y: S + 28, w: 14, h: 14 },
      { key: 'email', type: 'text', x: S + 22, y: S + 29, w: 180, h: 14, fontSize: 11, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S, y: S + 56, w: 14, h: 14 },
      { key: 'website', type: 'text', x: S + 22, y: S + 57, w: 180, h: 14, fontSize: 11, fill: 'light' },
      { key: 'address1', type: 'text', x: S, y: S + 88, w: 200, h: 12, fontSize: 9, fill: 'light' },
      { key: 'qr', type: 'qr', x: R - 100, y: S, w: 100, h: 100 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: R - 92, y: B - 28, w: 18, h: 18 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: R - 64, y: B - 28, w: 18, h: 18 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: R - 36, y: B - 28, w: 18, h: 18 },
    ],
  },
  // ── 9. CORPORATE GRID ──
  {
    title: 'Corporate Grid', title_mn: 'Корпорат грид',
    accent: '#6366F1', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'back',
    front: [
      { key: 'logo', type: 'image', x: S, y: S, w: 48, h: 48 },
      { key: 'company_name', type: 'text', x: S, y: S + 60, w: 180, h: 18, fontSize: 13, fontWeight: 'bold', fill: 'accent' },
      { key: 'company_message', type: 'text', x: S, y: S + 80, w: 180, h: 14, fontSize: 9, fill: 'light' },
      { key: 'full_name', type: 'text', x: CX + 12, y: S, w: 200, h: 22, fontSize: 16, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: CX + 12, y: S + 24, w: 200, h: 14, fontSize: 10, fill: 'light' },
    ],
    back: [
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S, y: S, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 18, y: S, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: CX, y: S, w: 12, h: 12 },
      { key: 'email', type: 'text', x: CX + 18, y: S, w: 180, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S, y: S + 24, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 18, y: S + 24, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'address1', type: 'text', x: CX, y: S + 24, w: 180, h: 12, fontSize: 9, fill: 'light' },
      { key: 'qr', type: 'qr', x: S, y: B - 80, w: 76, h: 76 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: R - 56, y: B - 24, w: 14, h: 14 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: R - 36, y: B - 24, w: 14, h: 14 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: R - 16, y: B - 24, w: 14, h: 14 },
    ],
  },
  // ── 10. CREATIVE BALANCED ──
  {
    title: 'Creative Balanced', title_mn: 'Бүтээлч тэнцвэр',
    accent: '#E11D48', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280',
    social_placement: 'back',
    front: [
      { key: 'full_name', type: 'text', x: S, y: S + 8, w: 300, h: 32, fontSize: 22, fontWeight: 'bold', fill: 'accent' },
      { key: 'job_title', type: 'text', x: S, y: S + 44, w: 240, h: 16, fontSize: 11, fill: 'light' },
      { key: 'company_name', type: 'text', x: S, y: S + 64, w: 240, h: 16, fontSize: 11, fill: 'light' },
      { key: 'logo', type: 'image', x: R - 52, y: S, w: 48, h: 48 },
    ],
    back: [
      { key: 'icon_phone', type: 'icon', icon: 'phone', x: S, y: S, w: 12, h: 12 },
      { key: 'phone', type: 'text', x: S + 18, y: S, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_email', type: 'icon', icon: 'email', x: S, y: S + 24, w: 12, h: 12 },
      { key: 'email', type: 'text', x: S + 18, y: S + 24, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'icon_web', type: 'icon', icon: 'web', x: S, y: S + 48, w: 12, h: 12 },
      { key: 'website', type: 'text', x: S + 18, y: S + 48, w: 160, h: 14, fontSize: 10, fill: 'light' },
      { key: 'address1', type: 'text', x: S, y: S + 76, w: 200, h: 12, fontSize: 8, fill: 'light' },
      { key: 'qr', type: 'qr', x: R - 88, y: S, w: 84, h: 84 },
      { key: 'logo', type: 'image', x: R - 48, y: B - 48, w: 44, h: 44 },
      { key: 'icon_fb', type: 'icon', icon: 'fb', x: S, y: B - 24, w: 16, h: 16 },
      { key: 'icon_ig', type: 'icon', icon: 'ig', x: S + 24, y: B - 24, w: 16, h: 16 },
      { key: 'icon_in', type: 'icon', icon: 'in', x: S + 48, y: B - 24, w: 16, h: 16 },
    ],
  },
];

ds.initialize().then(async () => {
  await ds.query('DELETE FROM templates');
  console.log('Cleared old templates');
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    await ds.query(
      `INSERT INTO templates (id, title, title_mn, category, designer_id, designer_name, status, width_mm, height_mm, canvas_data, zones, back_zones, social_placement, price, sort_order)
       VALUES (gen_random_uuid(), $1, $2, 'business_card', 'admin', 'Админ', 'approved', 90, 55, $3, $4, $5, $6, 0, $7)`,
      [
        t.title, t.title_mn,
        JSON.stringify({ accent: t.accent, bg: t.bg, textDark: t.textDark, textLight: t.textLight }),
        JSON.stringify(t.front),
        JSON.stringify(t.back),
        t.social_placement,
        i + 1,
      ]
    );
    console.log(`${i + 1}. ${t.title_mn}`);
  }
  const count = await ds.query('SELECT COUNT(*) FROM templates');
  console.log('Total:', count[0].count);
  await ds.destroy();
}).catch(e => console.error(e.message));
