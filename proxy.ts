import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from '@/lib/env/public'

const PUBLIC_ROUTES = new Set([
  '/login',
  '/auth/callback',
  '/nova-senha',
  '/politica-privacidade',
  '/termos-uso',
])

// A função PRECISA se chamar proxy para funcionar no Next.js 16+
export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const path = url.pathname
  const isPublicRoute = PUBLIC_ROUTES.has(path)
  const isPublicFile = Boolean(path.match(/\.(.*)$/))

  // Rotas públicas não dependem de uma chamada remota ao Auth. Isso mantém
  // login/callback/recuperação disponíveis mesmo durante degradação do Supabase.
  if (isPublicRoute || isPublicFile) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
