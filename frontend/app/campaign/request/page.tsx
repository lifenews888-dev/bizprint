import type { Metadata } from 'next'
import { Suspense } from 'react'
import CampaignRequestView from './CampaignRequestView'

export const metadata: Metadata = {
  title: 'Байгууллагын захиалга, кампанит ажил | BizPrint',
  description: 'Нэрийн хуудас, баннер, туг, брошур, бэлэг — олон бүтээгдэхүүнээ нэг хүсэлтээр. Урьдчилсан үнэ шууд, эцсийн үнийн санал 24 цагт.',
  alternates: { canonical: 'https://bizprint.mn/campaign/request' },
}

export default function CampaignRequestPage() {
  return (
    <Suspense>
      <CampaignRequestView />
    </Suspense>
  )
}
