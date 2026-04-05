import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: org } = await service
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!org) redirect('/signup')

  const initials = user.email[0].toUpperCase()
  const username = user.email.split('@')[0]

  return (
    <DashboardShell
      orgName={org.name}
      initials={initials}
      username={username}
      email={user.email}
    >
      {children}
    </DashboardShell>
  )
}
