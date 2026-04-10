import { redirect } from 'next/navigation'

export default function InstantQuoteRedirect() {
  redirect('/quote?tab=quick')
}
