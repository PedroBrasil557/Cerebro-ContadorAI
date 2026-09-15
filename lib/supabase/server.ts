import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicEnv } from '@/lib/env/public'

function isReadOnlyCookieError(error: unknown) {
  return error instanceof Error && (
    error.message.includes('Cookies can only be modified') ||
    error.message.includes('Server Action or Route Handler')
  )
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            if (!isReadOnlyCookieError(error)) throw error
          }
        },
      },
    }
  )
}
