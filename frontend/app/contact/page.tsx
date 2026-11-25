import type { Metadata } from 'next'
import ContactView from './ContactView'

export const metadata: Metadata = {
  title: 'Холбоо барих — BizPrint · Логос Төв 701 тоот',
  description: 'BizPrint: Чингэлтэй дүүрэг, 6-р хороо, Лааганы гудамж, Логос Төв 7 давхар, 701 тоот. Утас 7200-0444, info@bizprint.mn. Газрын зураг, ажлын цаг.',
  alternates: { canonical: 'https://bizprint.mn/contact' },
}

const LAT = 47.927242384534715
const LNG = 106.90713884386324

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'BizPrint',
  legalName: 'Юү Эм Би Верто ХХК',
  url: 'https://bizprint.mn',
  telephone: '+976-7200-0444',
  email: 'info@bizprint.mn',
  image: 'https://bizprint.mn/contact/bizprint-location.jpg',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Лааганы гудамж, Логос Төв 7 давхар, 701 тоот',
    addressLocality: 'Улаанбаатар',
    addressRegion: 'Чингэлтэй дүүрэг, 6-р хороо',
    addressCountry: 'MN',
  },
  geo: { '@type': 'GeoCoordinates', latitude: LAT, longitude: LNG },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00', closes: '18:00',
  }],
  sameAs: ['https://www.facebook.com/bizprintpro', 'https://www.instagram.com/bizprintpro25'],
}

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContactView lat={LAT} lng={LNG} />
    </>
  )
}
