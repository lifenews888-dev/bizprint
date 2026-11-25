import HomeLanding from '@/components/site/HomeLanding'

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BizPrint',
  url: 'https://bizprint.mn',
  telephone: '+976-7200-0444',
  email: 'info@bizprint.mn',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Лааганы гудамж, Логос Төв 7 давхар, 701 тоот',
    addressLocality: 'Улаанбаатар',
    addressCountry: 'MN',
  },
}

export default function HomePage() {
  return (
    <>
      <HomeLanding />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
    </>
  )
}
