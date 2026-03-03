'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client' // <--- Importação nova
import MainAppLayout from '@/core/layouts/MainAppLayout'
import { Loader2 } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient() // <--- Instância nova

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Tenta pegar a sessão atual (Agora funciona com @supabase/ssr)
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (!currentSession) {
          router.replace('/login')
          return
        }

        setSession(currentSession)
        setLoading(false)

      } catch (error) {
        console.error("Erro no login:", error)
        router.replace('/login')
      }
    }

    // Ouve mudanças (login/logout) em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
        setLoading(false)
      } else {
        router.replace('/login')
      }
    })

    checkUser()

    return () => subscription.unsubscribe()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  // Só renderiza se tiver sessão
  if (session) {
    return <MainAppLayout session={session} />
  }

  return null
}