import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdvisorClient from './AdvisorClient'

export const metadata = { title: 'AI Advisor — NexusForge' }

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, plan_id, subscription_status')
    .eq('owner_id', user.id)
    .single()
  if (!org) redirect('/onboarding')

  return <AdvisorClient orgName={org.name ?? 'your business'} />
}
