import { redirect } from 'next/navigation'
import MainAppLayout from '@/core/layouts/MainAppLayout'
import { createClient } from '@/lib/supabase/server'

export default async function AuthenticatedAppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <MainAppLayout user={user} />
}
