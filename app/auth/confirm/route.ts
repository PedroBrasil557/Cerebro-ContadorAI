import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')

  if (!tokenHash) {
    return NextResponse.redirect(`${origin}/login?state=link-expired`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'signup',
  })

  if (error) {
    return NextResponse.redirect(`${origin}/login?state=link-expired`)
  }

  return NextResponse.redirect(`${origin}/login?state=confirmed`)
}
