/**
 * Seed 20 business card layouts v3 — full fields + icons
 * node seed-bc-v3.js
 */
const PID = '57229fb9-12d5-4104-863f-d95e619f30d8'
const API = 'http://localhost:4000'

async function getToken() {
  const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@bizprint.mn', password: 'Admin@2026' }) })
  return (await r.json()).access_token
}

// Front zone builder helpers
const txt = (key, label, x, y, w, h, fontSize, opts = {}) => ({ key, label, x, y, w, h, fontSize, ...opts })
const logo = (x, y, w = 80, h = 80) => ({ key: 'logo', x, y, w, h, type: 'logo' })
const qr = (x, y, s = 60) => ({ key: 'qr', x, y, w: s, h: s, type: 'qr' })
const soc = (x, y, w = 80, h = 30) => ({ key: 'social', x, y, w, h, type: 'social' })
const ico = (icon, x, y, s = 14) => ({ key: `icon_${icon}`, type: 'icon', icon, x, y, w: s, h: s })

// Back zone builder
const backCenter = () => [
  logo(185, 50, 80, 80),
  txt('company_name', 'Company', 110, 145, 230, 24, 16, { fontWeight: 'bold', fill: 'accent', align: 'center' }),
  txt('website', 'Web', 140, 175, 170, 18, 11, { fill: 'light', align: 'center' }),
  soc(160, 205, 130, 30),
]

const LAYOUTS = [
  { name: 'Classic Left v2', name_mn: 'Сонгодог зүүн', type: 'business',
    front_json: [
      txt('company_name', 'Company', 20, 14, 200, 22, 12, { fontWeight: 'bold', fill: 'accent' }),
      txt('full_name', 'Name', 20, 42, 240, 28, 20, { fontWeight: 'bold', fill: 'accent' }),
      txt('job_title', 'Title', 20, 74, 200, 18, 11, { fill: 'light' }),
      ico('phone', 20, 130, 12), txt('phone', 'Phone', 38, 130, 160, 16, 10, { fill: 'light' }),
      ico('email', 20, 152, 12), txt('email', 'Email', 38, 152, 180, 16, 10, { fill: 'light' }),
      ico('web', 20, 174, 12), txt('website', 'Web', 38, 174, 160, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 20, 200, 220, 16, 9, { fill: 'light' }),
      logo(350, 14, 80, 80), qr(362, 195, 60),
    ], back_json: backCenter() },

  { name: 'Right Corporate', name_mn: 'Баруун корпорат', type: 'corporate',
    front_json: [
      logo(20, 20, 70, 70),
      txt('company_name', 'Company', 200, 14, 230, 22, 13, { fontWeight: 'bold', fill: 'accent', align: 'right' }),
      txt('full_name', 'Name', 170, 50, 260, 28, 20, { fontWeight: 'bold', fill: 'accent', align: 'right' }),
      txt('job_title', 'Title', 250, 82, 180, 18, 11, { fill: 'light', align: 'right' }),
      txt('phone', 'Phone', 270, 140, 160, 16, 10, { fill: 'light', align: 'right' }), ico('phone', 256, 140, 12),
      txt('email', 'Email', 250, 162, 180, 16, 10, { fill: 'light', align: 'right' }), ico('email', 236, 162, 12),
      txt('website', 'Web', 270, 184, 160, 16, 10, { fill: 'light', align: 'right' }), ico('web', 256, 184, 12),
      txt('address1', 'Addr', 220, 210, 210, 16, 9, { fill: 'light', align: 'right' }),
      qr(20, 195, 55),
    ], back_json: backCenter() },

  { name: 'Centered Elegant', name_mn: 'Голчилсон', type: 'creative',
    front_json: [
      txt('full_name', 'Name', 90, 25, 270, 30, 22, { fontWeight: 'bold', fill: 'accent', align: 'center' }),
      txt('job_title', 'Title', 130, 60, 190, 18, 11, { fill: 'light', align: 'center' }),
      txt('company_name', 'Company', 120, 82, 210, 20, 12, { fontWeight: 'bold', fill: 'dark', align: 'center' }),
      ico('phone', 120, 130, 11), txt('phone', 'Phone', 136, 130, 100, 16, 10, { fill: 'light' }),
      ico('email', 250, 130, 11), txt('email', 'Email', 266, 130, 130, 16, 10, { fill: 'light' }),
      ico('web', 165, 155, 11), txt('website', 'Web', 181, 155, 120, 16, 10, { fill: 'light', align: 'center' }),
      txt('address1', 'Addr', 120, 185, 210, 16, 9, { fill: 'light', align: 'center' }),
      qr(20, 200, 50), soc(340, 200, 80, 30),
    ], back_json: backCenter() },

  { name: 'Bold Name', name_mn: 'Том нэр', type: 'bold',
    front_json: [
      txt('full_name', 'Name', 20, 18, 340, 36, 28, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 58, 200, 18, 12, { fill: 'accent' }),
      txt('company_name', 'Company', 20, 82, 200, 18, 11, { fill: 'light' }),
      ico('phone', 20, 150, 12), txt('phone', 'Phone', 38, 150, 160, 16, 10, { fill: 'light' }),
      ico('email', 20, 172, 12), txt('email', 'Email', 38, 172, 180, 16, 10, { fill: 'light' }),
      ico('web', 20, 194, 12), txt('website', 'Web', 38, 194, 160, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 20, 224, 220, 16, 9, { fill: 'light' }),
      logo(355, 14, 75, 75), qr(365, 195, 58),
    ], back_json: backCenter() },

  { name: 'Minimal Clean', name_mn: 'Энгийн цэвэр', type: 'minimal',
    front_json: [
      txt('full_name', 'Name', 30, 35, 250, 28, 20, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 30, 68, 200, 18, 11, { fill: 'light' }),
      ico('phone', 30, 140, 11), txt('phone', 'Phone', 46, 140, 150, 16, 10, { fill: 'dark' }),
      ico('email', 30, 162, 11), txt('email', 'Email', 46, 162, 180, 16, 10, { fill: 'dark' }),
      ico('web', 30, 184, 11), txt('website', 'Web', 46, 184, 150, 16, 10, { fill: 'light' }),
      qr(368, 198, 56),
    ], back_json: backCenter() },

  { name: 'Split Layout', name_mn: 'Хуваагдсан', type: 'bold',
    front_json: [
      txt('full_name', 'Name', 20, 18, 180, 26, 18, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 48, 180, 18, 11, { fill: 'accent' }),
      txt('company_name', 'Company', 20, 72, 180, 18, 11, { fontWeight: 'bold', fill: 'dark' }),
      ico('phone', 240, 22, 12), txt('phone', 'Phone', 258, 22, 170, 16, 10, { fill: 'light', align: 'right' }),
      ico('email', 240, 44, 12), txt('email', 'Email', 258, 44, 170, 16, 10, { fill: 'light', align: 'right' }),
      ico('web', 240, 66, 12), txt('website', 'Web', 258, 66, 170, 16, 10, { fill: 'light', align: 'right' }),
      txt('address1', 'Addr', 240, 92, 190, 16, 9, { fill: 'light', align: 'right' }),
      logo(20, 185, 60, 60), qr(370, 195, 55), soc(100, 210, 100, 25),
    ], back_json: backCenter() },

  { name: 'Top Banner', name_mn: 'Дээд баннер', type: 'corporate',
    front_json: [
      txt('company_name', 'Company', 90, 12, 270, 22, 13, { fontWeight: 'bold', fill: 'accent', align: 'center' }),
      txt('company_message', 'Slogan', 120, 36, 210, 16, 9, { fill: 'light', align: 'center' }),
      logo(20, 8, 55, 55), qr(378, 8, 50),
      txt('full_name', 'Name', 20, 85, 260, 28, 20, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 116, 200, 18, 11, { fill: 'light' }),
      ico('phone', 20, 165, 12), txt('phone', 'Phone', 38, 165, 160, 16, 10, { fill: 'light' }),
      ico('email', 20, 187, 12), txt('email', 'Email', 38, 187, 180, 16, 10, { fill: 'light' }),
      ico('web', 20, 209, 12), txt('website', 'Web', 38, 209, 160, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 20, 240, 220, 16, 9, { fill: 'light' }),
      soc(300, 240, 100, 25),
    ], back_json: backCenter() },

  { name: 'Two Column', name_mn: 'Хоёр багана', type: 'business',
    front_json: [
      logo(20, 14, 65, 65),
      txt('company_name', 'Company', 95, 18, 200, 22, 13, { fontWeight: 'bold', fill: 'dark' }),
      txt('company_message', 'Slogan', 95, 42, 200, 16, 9, { fill: 'light' }),
      txt('full_name', 'Name', 20, 100, 250, 28, 20, { fontWeight: 'bold', fill: 'accent' }),
      txt('job_title', 'Title', 20, 130, 200, 18, 11, { fill: 'light' }),
      ico('phone', 20, 175, 12), txt('phone', 'Phone', 38, 175, 150, 16, 10, { fill: 'light' }),
      ico('email', 20, 197, 12), txt('email', 'Email', 38, 197, 180, 16, 10, { fill: 'light' }),
      ico('web', 250, 175, 12), txt('website', 'Web', 268, 175, 160, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 250, 197, 180, 16, 9, { fill: 'light' }),
      qr(365, 100, 60), soc(350, 14, 80, 25),
    ], back_json: backCenter() },

  { name: 'Bottom Contact', name_mn: 'Доод холбоо', type: 'creative',
    front_json: [
      txt('full_name', 'Name', 20, 25, 280, 32, 24, { fontWeight: 'bold', fill: 'accent' }),
      txt('job_title', 'Title', 20, 62, 200, 18, 12, { fill: 'light' }),
      txt('company_name', 'Company', 20, 85, 200, 18, 11, { fill: 'dark' }),
      logo(360, 18, 72, 72),
      ico('phone', 20, 190, 12), txt('phone', 'Phone', 38, 190, 120, 16, 10, { fill: 'light' }),
      ico('email', 170, 190, 12), txt('email', 'Email', 188, 190, 140, 16, 10, { fill: 'light' }),
      ico('web', 20, 215, 12), txt('website', 'Web', 38, 215, 120, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 170, 215, 180, 16, 9, { fill: 'light' }),
      qr(370, 195, 58), soc(20, 245, 120, 22),
    ], back_json: backCenter() },

  { name: 'Logo Center', name_mn: 'Лого голд', type: 'corporate',
    front_json: [
      logo(185, 10, 80, 80),
      txt('company_name', 'Company', 120, 95, 210, 20, 12, { fontWeight: 'bold', fill: 'accent', align: 'center' }),
      txt('full_name', 'Name', 100, 125, 250, 26, 18, { fontWeight: 'bold', fill: 'dark', align: 'center' }),
      txt('job_title', 'Title', 140, 154, 170, 18, 11, { fill: 'light', align: 'center' }),
      ico('phone', 80, 195, 11), txt('phone', 'Phone', 96, 195, 110, 16, 10, { fill: 'light' }),
      ico('email', 250, 195, 11), txt('email', 'Email', 266, 195, 130, 16, 10, { fill: 'light' }),
      ico('web', 160, 220, 11), txt('website', 'Web', 176, 220, 120, 16, 10, { fill: 'light', align: 'center' }),
      txt('address1', 'Addr', 120, 245, 210, 16, 9, { fill: 'light', align: 'center' }),
      qr(380, 10, 50),
    ], back_json: backCenter() },

  { name: 'Left Stripe', name_mn: 'Зүүн зураас', type: 'bold',
    front_json: [
      txt('company_name', 'Company', 20, 10, 200, 20, 11, { fontWeight: 'bold', fill: 'accent' }),
      txt('full_name', 'Name', 20, 38, 280, 32, 24, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 74, 200, 18, 12, { fill: 'accent' }),
      ico('phone', 20, 145, 12), txt('phone', 'Phone', 38, 145, 160, 16, 10, { fill: 'light' }),
      ico('email', 20, 167, 12), txt('email', 'Email', 38, 167, 180, 16, 10, { fill: 'light' }),
      ico('web', 20, 189, 12), txt('website', 'Web', 38, 189, 160, 16, 10, { fill: 'accent' }),
      txt('address1', 'Addr', 20, 218, 220, 16, 9, { fill: 'light' }),
      txt('address2', 'Addr2', 20, 236, 220, 16, 9, { fill: 'light' }),
      logo(355, 14, 75, 75), qr(365, 195, 58),
    ], back_json: backCenter() },

  { name: 'Card Wide', name_mn: 'Өргөн загвар', type: 'business',
    front_json: [
      txt('company_name', 'Company', 20, 14, 200, 20, 12, { fontWeight: 'bold', fill: 'accent' }),
      txt('company_message', 'Slogan', 20, 36, 200, 16, 9, { fill: 'light' }),
      txt('full_name', 'Name', 20, 65, 260, 28, 20, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 96, 200, 18, 11, { fill: 'light' }),
      ico('phone', 20, 155, 12), txt('phone', 'Phone', 38, 155, 130, 16, 10, { fill: 'light' }),
      ico('email', 190, 155, 12), txt('email', 'Email', 208, 155, 140, 16, 10, { fill: 'light' }),
      ico('web', 20, 177, 12), txt('website', 'Web', 38, 177, 130, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 190, 177, 170, 16, 9, { fill: 'light' }),
      logo(355, 14, 75, 75), qr(365, 195, 58), soc(20, 210, 140, 22),
    ], back_json: backCenter() },

  { name: 'Compact Info', name_mn: 'Нягт мэдээлэл', type: 'minimal',
    front_json: [
      txt('full_name', 'Name', 20, 20, 250, 26, 18, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 50, 200, 16, 10, { fill: 'light' }),
      txt('company_name', 'Company', 20, 70, 200, 18, 11, { fontWeight: 'bold', fill: 'accent' }),
      ico('phone', 20, 115, 10), txt('phone', 'Phone', 34, 115, 140, 14, 9, { fill: 'dark' }),
      ico('email', 20, 133, 10), txt('email', 'Email', 34, 133, 170, 14, 9, { fill: 'dark' }),
      ico('web', 20, 151, 10), txt('website', 'Web', 34, 151, 140, 14, 9, { fill: 'dark' }),
      txt('address1', 'Addr', 20, 175, 200, 14, 9, { fill: 'light' }),
      txt('address2', 'Addr2', 20, 191, 200, 14, 9, { fill: 'light' }),
      logo(360, 18, 68, 68), qr(368, 198, 55), soc(20, 220, 130, 22),
    ], back_json: backCenter() },

  { name: 'Name Center V2', name_mn: 'Нэр голд', type: 'creative',
    front_json: [
      txt('company_name', 'Company', 140, 10, 170, 18, 10, { fontWeight: 'bold', fill: 'accent', align: 'center' }),
      txt('full_name', 'Name', 80, 35, 290, 32, 24, { fontWeight: 'bold', fill: 'dark', align: 'center' }),
      txt('job_title', 'Title', 140, 72, 170, 18, 11, { fill: 'accent', align: 'center' }),
      ico('phone', 60, 125, 12), txt('phone', 'Phone', 78, 125, 120, 16, 10, { fill: 'light' }),
      ico('email', 250, 125, 12), txt('email', 'Email', 268, 125, 140, 16, 10, { fill: 'light' }),
      ico('web', 60, 150, 12), txt('website', 'Web', 78, 150, 120, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 250, 150, 160, 16, 9, { fill: 'light' }),
      logo(20, 10, 50, 50), qr(380, 10, 48), soc(170, 200, 110, 25),
    ], back_json: backCenter() },

  { name: 'Professional', name_mn: 'Мэргэжлийн', type: 'corporate',
    front_json: [
      logo(20, 15, 60, 60),
      txt('company_name', 'Company', 90, 20, 200, 22, 13, { fontWeight: 'bold', fill: 'dark' }),
      txt('company_message', 'Slogan', 90, 44, 200, 16, 9, { fill: 'light' }),
      txt('full_name', 'Name', 20, 100, 260, 28, 20, { fontWeight: 'bold', fill: 'accent' }),
      txt('job_title', 'Title', 20, 132, 200, 18, 11, { fill: 'light' }),
      ico('phone', 20, 178, 12), txt('phone', 'Phone', 38, 178, 150, 16, 10, { fill: 'dark' }),
      ico('email', 20, 200, 12), txt('email', 'Email', 38, 200, 180, 16, 10, { fill: 'dark' }),
      ico('web', 20, 222, 12), txt('website', 'Web', 38, 222, 150, 16, 10, { fill: 'accent' }),
      txt('address1', 'Addr', 20, 250, 220, 14, 9, { fill: 'light' }),
      qr(368, 198, 58), soc(350, 14, 80, 25),
    ], back_json: backCenter() },

  { name: 'Diagonal Layout', name_mn: 'Диагональ', type: 'creative',
    front_json: [
      txt('company_name', 'Company', 20, 10, 200, 20, 11, { fontWeight: 'bold', fill: 'accent' }),
      logo(350, 10, 80, 80),
      txt('full_name', 'Name', 20, 50, 300, 32, 24, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 86, 200, 18, 12, { fill: 'accent' }),
      txt('company_message', 'Slogan', 20, 110, 250, 16, 9, { fill: 'light' }),
      ico('phone', 20, 170, 12), txt('phone', 'Phone', 38, 170, 150, 16, 10, { fill: 'light' }),
      ico('email', 200, 170, 12), txt('email', 'Email', 218, 170, 160, 16, 10, { fill: 'light' }),
      ico('web', 20, 195, 12), txt('website', 'Web', 38, 195, 150, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 200, 195, 170, 16, 9, { fill: 'light' }),
      qr(20, 220, 45), soc(80, 230, 120, 22),
    ], back_json: backCenter() },

  { name: 'Icon Row', name_mn: 'Icon мөр', type: 'business',
    front_json: [
      txt('full_name', 'Name', 20, 20, 260, 28, 20, { fontWeight: 'bold', fill: 'accent' }),
      txt('job_title', 'Title', 20, 52, 200, 18, 11, { fill: 'light' }),
      txt('company_name', 'Company', 20, 75, 200, 18, 11, { fontWeight: 'bold', fill: 'dark' }),
      // Icon row
      ico('phone', 20, 140, 14), txt('phone', 'Phone', 40, 140, 140, 18, 11, { fill: 'dark' }),
      ico('email', 20, 164, 14), txt('email', 'Email', 40, 164, 170, 18, 11, { fill: 'dark' }),
      ico('web', 20, 188, 14), txt('website', 'Web', 40, 188, 140, 18, 11, { fill: 'dark' }),
      txt('address1', 'Addr', 20, 216, 220, 16, 10, { fill: 'light' }),
      logo(355, 18, 75, 75), qr(365, 195, 58),
    ], back_json: backCenter() },

  { name: 'Horizontal Split', name_mn: 'Хэвтээ хуваалт', type: 'bold',
    front_json: [
      txt('company_name', 'Company', 20, 12, 200, 20, 11, { fontWeight: 'bold', fill: 'accent' }),
      logo(350, 8, 60, 60),
      txt('full_name', 'Name', 20, 40, 300, 28, 20, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 72, 200, 18, 11, { fill: 'light' }),
      // Bottom half — contact with icons
      ico('phone', 20, 150, 12), txt('phone', 'Phone', 38, 150, 130, 16, 10, { fill: 'light' }),
      ico('email', 200, 150, 12), txt('email', 'Email', 218, 150, 150, 16, 10, { fill: 'light' }),
      ico('web', 20, 175, 12), txt('website', 'Web', 38, 175, 130, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 200, 175, 170, 16, 9, { fill: 'light' }),
      soc(20, 210, 130, 22), qr(370, 195, 56),
    ], back_json: backCenter() },

  { name: 'Vertical Card', name_mn: 'Босоо загвар', type: 'creative',
    front_json: [
      logo(185, 10, 80, 80),
      txt('full_name', 'Name', 100, 100, 250, 28, 20, { fontWeight: 'bold', fill: 'accent', align: 'center' }),
      txt('job_title', 'Title', 140, 130, 170, 18, 11, { fill: 'light', align: 'center' }),
      txt('company_name', 'Company', 120, 155, 210, 18, 11, { fontWeight: 'bold', fill: 'dark', align: 'center' }),
      ico('phone', 130, 195, 11), txt('phone', 'Phone', 146, 195, 120, 16, 10, { fill: 'light' }),
      ico('email', 130, 215, 11), txt('email', 'Email', 146, 215, 140, 16, 10, { fill: 'light' }),
      ico('web', 130, 235, 11), txt('website', 'Web', 146, 235, 120, 16, 10, { fill: 'light' }),
      qr(380, 220, 48),
    ], back_json: backCenter() },

  { name: 'Full Info', name_mn: 'Бүрэн мэдээлэл', type: 'business',
    front_json: [
      txt('company_name', 'Company', 20, 12, 200, 22, 13, { fontWeight: 'bold', fill: 'accent' }),
      txt('company_message', 'Slogan', 20, 36, 200, 16, 9, { fill: 'light' }),
      txt('full_name', 'Name', 20, 62, 260, 28, 20, { fontWeight: 'bold', fill: 'dark' }),
      txt('job_title', 'Title', 20, 94, 200, 18, 11, { fill: 'accent' }),
      ico('phone', 20, 140, 12), txt('phone', 'Phone', 38, 140, 150, 16, 10, { fill: 'light' }),
      ico('email', 20, 160, 12), txt('email', 'Email', 38, 160, 180, 16, 10, { fill: 'light' }),
      ico('web', 20, 180, 12), txt('website', 'Web', 38, 180, 150, 16, 10, { fill: 'light' }),
      txt('address1', 'Addr', 20, 206, 220, 16, 9, { fill: 'light' }),
      txt('address2', 'Addr2', 20, 224, 220, 16, 9, { fill: 'light' }),
      logo(350, 12, 80, 80), qr(362, 192, 62), soc(20, 248, 140, 22),
    ], back_json: backCenter() },
]

async function seed() {
  const token = await getToken()
  if (!token) { console.error('Login failed'); return }
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  // Өмнөх загваруудыг устгахгүй — зөвхөн нэмнэ
  console.log('Adding 20 new icon layouts (keeping existing)...')

  // Create 20 new
  for (let i = 0; i < LAYOUTS.length; i++) {
    const l = LAYOUTS[i]
    const res = await fetch(`${API}/admin/business-cards/${PID}/layouts`, {
      method: 'POST', headers,
      body: JSON.stringify({ ...l, canvas_data: { accent: '#FF6B00', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' }, sort_order: i + 1 }),
    })
    const data = await res.json()
    console.log(`${i + 1}/20 ✓ ${l.name_mn}`, data?.id ? 'OK' : 'FAIL')
  }
  console.log('\nDone! 20 layouts with icons created.')
}

seed().catch(console.error)
