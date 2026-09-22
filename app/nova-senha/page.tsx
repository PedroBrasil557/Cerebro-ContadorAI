'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, Loader2, LockKeyhole } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthExperienceShell } from '@/core/auth/AuthExperienceShell'
import { Button } from '@/core/ui/button'
import { Field } from '@/core/ui/field'
import { Input } from '@/core/ui/input'
import { createClient } from '@/lib/supabase/client'

type RecoveryState = 'checking' | 'valid' | 'expired'

export default function NewPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    let recoveryConfirmed = false

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' && session) {
        recoveryConfirmed = true
        setRecoveryState('valid')
      }
    })

    const timeout = window.setTimeout(() => {
      if (mounted && !recoveryConfirmed) setRecoveryState('expired')
    }, 2500)

    return () => {
      mounted = false
      window.clearTimeout(timeout)
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (recoveryState !== 'valid') {
      setFormError('Este link não possui mais uma sessão de recuperação válida.')
      return
    }
    if (password.length < 8) {
      setFormError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirmation) {
      setFormError('As senhas não são iguais.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setLoading(false)
      setFormError('Não foi possível atualizar a senha. Solicite um novo link de recuperação.')
      return
    }

    await supabase.auth.signOut()
    toast.success('Senha atualizada. Entre novamente com a nova senha.')
    router.replace('/login')
  }

  if (recoveryState === 'checking') {
    return (
      <AuthExperienceShell
        eyebrow="Nova senha"
        title="Validando seu link"
        description="Estamos confirmando a sessão de recuperação antes de liberar a alteração."
        heroEyebrow="Nova credencial"
        heroTitle="Uma senha nova. O mesmo contexto protegido."
        heroDescription="Você troca a credencial sem perder o que já organizou. Segurança deve preservar continuidade."
        mobileHeroTitle="Uma senha nova."
        heroMode="password"
        heroFooter="Proteção sem ruído. Controle sem fricção."
      >
        <div className="flex items-center gap-3 rounded-[14px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-sm text-[var(--neutral-600)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-500)]" aria-hidden="true" />
          Validando link de recuperação…
        </div>
      </AuthExperienceShell>
    )
  }

  if (recoveryState === 'expired') {
    return (
      <AuthExperienceShell
        eyebrow="Link expirado"
        title="Este link não está mais disponível"
        description="Links de recuperação têm prazo para proteger sua conta. Solicite outro para continuar."
        heroEyebrow="Prazo de segurança"
        heroTitle="Links seguros têm prazo."
        heroDescription="Isso reduz o risco de reutilização indevida. Solicitar outro link leva só alguns segundos."
        mobileHeroTitle="Links seguros têm prazo."
        heroMode="expired"
        heroFooter="Proteção sem ruído. Controle sem fricção."
      >
        <div className="space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]">
            <Clock3 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="rounded-[14px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-xs leading-5 text-[var(--neutral-600)]">
            <strong className="block text-[var(--neutral-700)]">Nada foi alterado na sua conta.</strong>
            <span className="mt-1 block">Um novo link substitui o anterior e mantém o processo protegido.</span>
          </div>
          <Button className="w-full" onClick={() => router.replace('/login?state=forgot')}>Solicitar novo link</Button>
          <button type="button" className="text-sm font-semibold text-[var(--brand-500)]" onClick={() => router.replace('/login')}>Voltar para entrar</button>
        </div>
      </AuthExperienceShell>
    )
  }

  return (
    <AuthExperienceShell
      eyebrow="Nova senha"
      title="Crie uma nova senha"
      description="Escolha uma senha nova para voltar ao seu espaço com segurança."
      heroEyebrow="Nova credencial"
      heroTitle="Uma senha nova. O mesmo contexto protegido."
      heroDescription="Você troca a credencial sem perder o que já organizou. Segurança deve preservar continuidade."
      mobileHeroTitle="Uma senha nova."
      heroMode="password"
      heroFooter="Proteção sem ruído. Controle sem fricção."
    >
      <div className="space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-700)]">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nova senha" htmlFor="new-password">
            <Input
              id="new-password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label="Confirmar nova senha" htmlFor="confirm-password">
            <Input
              id="confirm-password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              placeholder="Sua senha"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field>

          <div className="rounded-[16px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
            <p className="text-xs font-semibold text-[var(--neutral-700)]">Sua senha deve ter:</p>
            <div className="mt-3 space-y-2 text-[11px] text-[var(--neutral-600)]">
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--brand-700)]" aria-hidden="true" /> 8 ou mais caracteres</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--brand-700)]" aria-hidden="true" /> Uma combinação difícil de adivinhar</p>
              <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--brand-700)]" aria-hidden="true" /> Ser diferente da senha anterior</p>
            </div>
          </div>

          {formError ? <p role="alert" className="text-xs leading-5 text-[var(--color-text-error)]">{formError}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar nova senha
          </Button>
        </form>
        <button type="button" className="text-sm font-semibold text-[var(--brand-500)]" onClick={() => router.replace('/login')}>Voltar para entrar</button>
      </div>
    </AuthExperienceShell>
  )
}
