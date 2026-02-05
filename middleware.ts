import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // --- DEFINIÇÃO DE ROTAS PÚBLICAS ---
  // Aqui listamos tudo que NÃO precisa de login para ser acessado
  const isPublicRoute = 
    path.startsWith('/login') || 
    path.startsWith('/auth') || 
    path.startsWith('/politica-privacidade') || // LIBERADO
    path.startsWith('/termos-uso') ||           // LIBERADO
    path.startsWith('/api')                     // Geralmente APIs públicas (webhooks) devem ser liberadas

  // 1. Se NÃO estiver logado e a rota NÃO for pública -> Redireciona para Login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Se JÁ estiver logado e tentar acessar Login -> Redireciona para Dashboard
  if (user && path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}