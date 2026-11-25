// BizPrint landing page-ийн бүх текст, холбоос, зураг энд байна.
// Текст солих бол зөвхөн энэ файлыг засна.

export const brand = {
  short: 'BP',
  name: 'BizPrint',
  company: 'Юү Эм Би Верто ХХК',
  phone: '7200-0444',
  phoneHref: 'tel:+97672000444',
  email: 'info@bizprint.mn',
  address: 'Чингэлтэй дүүрэг, 6-р хороо, Лааганы гудамж, Логос Төв 7 давхар, 701 тоот',
  addressShort: 'Логос Төв · 701 тоот',
  orderHref: '/quote',
}

export const nav = [
  { label: 'Бүтээгдэхүүн', href: '#products' },
  { label: 'Бидний тухай', href: '#about' },
  { label: 'Иж бүрэн шийдэл', href: '#work' },
  { label: 'Холбоо барих', href: '#contact' },
]

export const hero = {
  label: 'BizPrint · Хэвлэлийн бүх үйлчилгээ',
  // Мөр бүр desktop дээр тусдаа мөрөнд гарна
  headline: ['Таны брэндийг хэвлэлээр', 'амилуулна — нэрийн хуудаснаас', 'фасадны туг хүртэл.'],
  availability: 'Ихэнх захиалга 1–2 хоногт бэлэн',
  navCta: 'Үнийн санал авах',
  cta: 'Захиалга өгөх',
  badge: 'Дизайн + хэвлэл',
  badgeTag: 'Нэг дор',
}

export const about = {
  step: '1',
  pill: 'BizPrint-ийг танилцуулъя',
  headline: ['Дизайнаас хүлээлгэн өгөх хүртэл —', 'бизнесийн хэвлэлийг нэг дороос.'],
  paragraph: [
    'Нэрийн хуудас, туг далбаа, баннер, стикер, офсет хэвлэл —',
    'дизайн гаргахаас эхлээд хэвлэж, хүлээлгэн өгөх хүртэл',
    'таны захиалгыг бид бүрэн хариуцна.',
  ],
  cta: 'Бидний тухай',
  // public/images/ хавтсанд өөрийн зургаа ижил нэрээр хийнэ
  imageSmall: '/print-landing/about-small.jpg',
  imageLarge: '/print-landing/about-large.jpg',
  imageSmallAlt: 'BizPrint-ийн хэвлэсэн нэрийн хуудас',
  imageLargeAlt: 'BizPrint-ийн хийсэн байгууллагын туг далбаа',
}

export const products = {
  step: '2',
  pill: 'Бүтээгдэхүүн',
  headline: 'Юу хэвлүүлэх вэ?',
  items: [
    { title: 'Нэрийн хуудас', note: 'Хоёр талтай · бүрэлттэй, лактай, бүрэлтгүй', image: '/print-landing/products/business-card.jpg' },
    { title: 'Компанийн туг далбаа', note: 'Алтан сүлжмэл захтай · силк, атлас', image: '/print-landing/products/company-flag.jpg' },
    { title: 'Ширээний туг', note: '14×20 см · алтлаг, мөнгөлөг, хуванцар суурь', image: '/print-landing/products/desk-flag.jpg' },
    { title: 'Гадна шон, фасадны туг', note: '4 метрээс 60 метр хүртэл, суурьтай нь', image: '/print-landing/products/pole-flag.jpg' },
    { title: 'Далавч туг', note: 'Үүдний гадна, арга хэмжээнд', image: '/print-landing/products/feather-flag.jpg' },
    { title: 'Ханын туг, вымпел', note: 'Оффис, хурлын танхимд', image: '/print-landing/products/wall-flag.jpg' },
    { title: 'Баннер', note: 'Бүх төрлийн баннер, хулдаасан хэвлэл', image: '/print-landing/products/banner.jpg' },
    { title: 'Арын хана (backdrop)', note: 'Хэвлэлийн бага хурал, арга хэмжээ', image: '/print-landing/products/backdrop.jpg' },
    { title: 'Гэрэлт хайрцаг', note: 'Гадна хаяг, самбар', image: '/print-landing/products/lightbox.jpg' },
    { title: 'Стикер, машины наалт', note: 'Хатуу хавтант, тунгалаг, машин бүрэх', image: '/print-landing/products/sticker.jpg' },
    { title: 'UV хэвлэл', note: 'Шил, металл, утасны гэр дээр', image: '/print-landing/products/uv.jpg' },
    { title: 'Офсет хэвлэл', note: 'Брошур, каталог, албан бланк', image: '/print-landing/products/offset.jpg' },
    { title: 'Өргөмжлөл, талархлын захидал', note: 'Хавтастай, албан ёсны загвартай', image: '/print-landing/products/certificate.jpg' },
    { title: 'Фото хэвлэл', note: '10×15 см', image: '/print-landing/products/photo.jpg' },
    { title: 'Лого хэвлэл', note: 'Футболк, малгай, аяга, бал', image: '/print-landing/products/merch.jpg' },
    { title: 'Бэлгийн багц', note: 'Байгууллагын VIP бэлэг', image: '/print-landing/products/giftset.jpg' },
  ],
  cta: 'Үнэ асуух',
}

export const work = {
  step: '3',
  pill: 'Иж бүрэн шийдэл',
  headline: 'Брэндийг тань бүрэн хувцаслана',
  cards: [
    {
      title: 'Албан хэрэгслийн иж бүрэн багц',
      description: 'Нэрийн хуудас, хавтас, дэвтэр, аяга, бүргэвч, цүнх — нэг брэнд, нэг өнгөөр',
      // Видео нэмэх бол public/videos/work-1.mp4. Байхгүй бол зураг гарна.
      video: '', // жишээ: '/videos/work-1.mp4'
      poster: '/print-landing/work-1.jpg',
      button: 'Захиалах',
      dark: false,
      aspect: 'aspect-[329/246]',
    },
    {
      title: 'Гадна хаяг, гэрэлт үсэг',
      description: 'Барилгын фасадны хайрцган үсэг, гэрэлт хаягаас эхлээд үүдний туг хүртэл',
      video: '', // жишээ: '/videos/work-2.mp4'
      poster: '/print-landing/work-2.jpg',
      button: 'Үнэ асуух',
      dark: true,
      aspect: 'aspect-square',
    },
  ],
}

export const contact = {
  headline: ['Захиалгаа өнөөдөр', 'эхлүүлье.'],
  paragraph: 'Хэмжээ, тоо ширхэг, хүссэн материалаа хэлээрэй — үнийн саналыг шууд гаргаж өгнө.',
  socials: [
    { label: 'Facebook', href: 'https://facebook.com/bizprintpro' },
    { label: 'Instagram', href: 'https://instagram.com/bizprintpro25' },
    { label: 'TikTok', href: 'https://tiktok.com/@bizprintmn' },
    { label: 'YouTube', href: 'https://youtube.com/@BizPrin' },
  ],
}

// ---------- Сайтын нийтлэг цэс (шинэ загвар) ----------
export const siteNav = [
  { label: 'Дэлгүүр', href: '/shop' },
  { label: 'Үнэ тооцоолох', href: '/quote' },
  { label: 'Галерей', href: '/gallery' },
  { label: 'Байгууллагад', href: '/campaign/request' },
  { label: 'Блог', href: '/posts' },
  { label: 'Холбоо барих', href: '/contact' },
]

export const footerLinks = [
  { label: 'Дэлгүүр', href: '/shop' },
  { label: 'Үнэ тооцоолох', href: '/quote' },
  { label: 'Галерей', href: '/gallery' },
  { label: 'Үнийн мэдээлэл', href: '/pricing' },
  { label: 'B2B харилцагч', href: '/b2b' },
  { label: 'Захиалга хянах', href: '/track' },
  { label: 'Хүргэлт', href: '/delivery' },
  { label: 'Бидний тухай', href: '/about' },
  { label: 'Түгээмэл асуулт', href: '/faq' },
  { label: 'Хамтран ажиллах', href: '/partner' },
]

// ---------- Нүүр хуудас (bizprint.mn) ----------
export const home = {
  hero: {
    ...hero,
    cta: 'Бүтээгдэхүүн сонгох',
    ctaHref: '/shop',
    secondary: 'Үнэ тооцоолох',
    secondaryHref: '/quote',
  },
  products: {
    pill: 'Бүтээгдэхүүн',
    headline: 'Хамгийн их захиалагддаг',
    sub: 'Бараагаа сонгоод хэмжээ, тоо ширхэг, материалаа оруулж шууд захиална.',
    cta: 'Бүх бүтээгдэхүүн',
  },
  quote: {
    pill: 'Үнэ шууд мэдэх',
    headline: ['Үнэ нь ил,', 'тооцоо нь тодорхой.'],
    paragraph: 'Албан ёсны үнийн жагсаалтаар бодно: хэмжээ, тоо, нэгжийн үнэ, хүргэлт бүгд харагдана. Бүртгэл шаардлагагүй.',
    steps: ['Бүтээгдэхүүнээ сонгоно', 'Хэмжээ, тоогоо оруулна', 'Тооцоогоо Messenger-ээр илгээнэ'],
  },
  services: [
    { title: 'Хэвлэл захиалах', note: 'Нэрийн хуудаснаас баннер хүртэл', href: '/quote' },
    { title: 'Дизайн хийлгэх', note: 'Загваргүй бол бид гаргана', href: '/design/editor' },
    { title: 'Байгууллагын захиалга', note: 'Оффис, эвент, бөөн захиалга', href: '/campaign/request' },
    { title: 'Яаралтай хэвлэл', note: 'Богино хугацаанд гүйцэтгэнэ', href: '/quick-order' },
  ],
  reviews: { pill: 'Сэтгэгдэл', headline: 'Үйлчлүүлэгчид юу гэж байна' },
}
