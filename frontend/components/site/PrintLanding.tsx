'use client'

import { Hero, About, Products, Work, Contact } from './sections'

/** bizprint.mn/print — статик сурталчилгааны хуудас (Facebook бүүст, имэйл) */
export default function PrintLanding() {
  return (
    <main className="site-light bg-white font-sans text-gray-900" data-theme="light">
      <Hero />
      <About />
      <Products />
      <Work />
      <Contact />
    </main>
  )
}
