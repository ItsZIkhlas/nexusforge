import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

export const metadata = { title: 'Unsubscribe', robots: 'noindex' }

export default async function UnsubscribePage({ searchParams }) {
  const { token } = await searchParams
  let status = 'invalid' // 'success' | 'already' | 'invalid'

  if (token) {
    const supabase = createServiceClient()

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, unsubscribed_at')
      .eq('unsubscribe_token', token)
      .maybeSingle()

    if (contact) {
      if (contact.unsubscribed_at) {
        status = 'already'
      } else {
        // Mark contact as unsubscribed
        await supabase
          .from('contacts')
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq('id', contact.id)

        // Cancel all active email enrollments for this contact
        await supabase
          .from('email_enrollments')
          .update({ status: 'unsubscribed' })
          .eq('contact_id', contact.id)
          .eq('status', 'active')

        status = 'success'
      }
    }
  }

  const icon = {
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        className="w-8 h-8 text-emerald-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    already: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        className="w-8 h-8 text-slate-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    invalid: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        className="w-8 h-8 text-red-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  }[status]

  const heading = {
    success: "You've been unsubscribed",
    already: 'Already unsubscribed',
    invalid: 'Invalid unsubscribe link',
  }[status]

  const body = {
    success: "You won't receive any more emails from this sender. This may take up to 24 hours to fully take effect.",
    already: 'This email address has already been removed from the mailing list.',
    invalid: 'This unsubscribe link is invalid or has expired. If you continue to receive emails you did not want, please reply directly to the sender.',
  }[status]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">

        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
          status === 'success' ? 'bg-emerald-50' :
          status === 'already' ? 'bg-slate-100' : 'bg-red-50'
        }`}>
          {icon}
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">{heading}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{body}</p>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <span className="font-medium text-gray-500">NexusForge</span>
          </p>
        </div>
      </div>
    </div>
  )
}
