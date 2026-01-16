import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 1. Cria uma resposta inicial que permite passar os headers adiante
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Cria o cliente Supabase para o Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Aqui está a mágica: atualizamos os cookies na Requisição e na Resposta
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          
          response = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 3. Atualiza a sessão (Isso é CRÍTICO para não deslogar o usuário)
  // IMPORTANTE: Não use getSession aqui, use getUser para segurança
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Lógica de Proteção de Rotas
  const url = request.nextUrl.clone()
  
  // Se NÃO estiver logado e tentar acessar qualquer página que não seja login ou auth
  if (!user && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se ESTIVER logado e tentar acessar o login
  if (user && url.pathname.startsWith('/login')) {
    url.pathname = '/' // Ou '/dashboard' dependendo da sua rota principal
    return NextResponse.redirect(url)
  }

  // Retorna a resposta com os cookies atualizados
  return response
}

export const config = {
  // Garante que o middleware rode em tudo, exceto arquivos estáticos e APIs internas do Next
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}