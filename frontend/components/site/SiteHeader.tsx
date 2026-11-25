'use client'

import SiteNav from './SiteNav'

/** Дотоод хуудсуудын дээд хэсэг: саарал зурвас дээр pill цэс, scroll хийхэд дээрээ үлдэнэ */
export default function SiteHeader() {
  return (
    <div className="sticky top-0 z-[900] bg-[#EFEFEF]">
      <SiteNav />
    </div>
  )
}
