import { redirect } from 'next/navigation'

export default function SmartQuoteRedirect() {
  redirect('/quote?tab=ai')
}
