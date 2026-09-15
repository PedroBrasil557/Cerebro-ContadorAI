'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Loader2, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function NewPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setHasSession(Boolean(data.session))
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasSession(Boolean(session))
        setCheckingSession(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmation) {
      toast.error('As senhas não são iguais.')
      return
    }

    if (!hasSession) {
      toast.error('O link expirou ou não contém uma sessão válida.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error('Não foi possível atualizar a senha. Solicite um novo link.')
      return
    }

    toast.success('Senha atualizada com sucesso.')
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] p-4 text-white">
      <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-indigo-600/10 blur-[130px]" />
      <section className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#09090b]/90 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3">
            <BrainCircuit className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Definir nova senha</h1>
          <p className="mt-2 text-sm text-gray-400">Crie uma senha segura para recuperar seu acesso.</p>
        </div>

        {checkingSession ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Validando link…
          </div>
        ) : !hasSession ? (
          <div className="space-y-5 text-center">
            <p className="text-sm text-amber-300">Este link expirou ou já foi utilizado.</p>
            <button onClick={() => router.replace('/login')} className="text-sm font-bold text-indigo-400 hover:text-indigo-300">
              Solicitar um novo link
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Nova senha
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#13131a] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-indigo-500/60" />
              </span>
            </label>
            <label className="block space-y-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Confirmar senha
              <input type="password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#13131a] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/60" />
            </label>
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-xs font-black uppercase tracking-widest disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Atualizar senha
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
