import Link from 'next/link'
import { TypeGrid } from './CatalogProductView'
import { catalog, catSlug, typesOf } from '@/lib/pricing'

/** Дэлгүүр: албан үнийн жагсаалтын 12 ангилал, бүтээгдэхүүн бүр өөрийн зурагтай */
export default function ShopCatalog({ active }: { active?: string }) {
  const cats = active ? catalog.categories.filter((c) => c === active) : catalog.categories
  const pill = (on: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'}`
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-[1440px] px-5 pb-6 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Дэлгүүр · {catalog.version}</p>
        <h1>{active || 'Хэвлэлийн бүтээгдэхүүн'}</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-gray-600 sm:text-[17px]">
          Бүтээгдэхүүнээ сонгоод хэмжээ, тоо, материалаа оруулахад үнэ шууд бодогдоно. Бүх үнэ НӨАТ орсон.
        </p>
        <nav className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href="/shop" className={pill(!active)}>Бүгд</Link>
          {catalog.categories.map((c) => (
            <Link key={c} href={`/shop/category/${catSlug(c)}`} className={pill(c === active)}>{c}</Link>
          ))}
        </nav>
      </section>
      <div className="mx-auto max-w-[1440px] space-y-16 px-5 pb-24 pt-6 sm:px-8 lg:px-12">
        {cats.map((c) => (
          <section key={c}>
            {!active && (
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-medium tracking-[-0.02em] text-gray-900">{c}</h2>
                <Link href={`/shop/category/${catSlug(c)}`} className="text-[13px] text-gray-500 hover:text-gray-900">Бүгдийг харах →</Link>
              </div>
            )}
            <TypeGrid types={typesOf(c)} />
          </section>
        ))}
      </div>
    </div>
  )
}
