'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AuthExperienceShell } from '@/core/auth/AuthExperienceShell'
import { Button } from '@/core/ui/button'
import { Field } from '@/core/ui/field'
import { Input } from '@/core/ui/input'
import { createClient } from '@/lib/supabase/client'

type ViewState =
  | 'login'
  | 'register'
  | 'confirm-email'
  | 'confirmed'
  | 'forgot'
  | 'recovery-sent'
  | 'link-expired'

type LoadingAction = 'form' | 'google' | 'resend' | null

const GOOGLE_EMAIL_DRAFT_KEY = 'cerebro.auth.email-draft'
const RESEND_COOLDOWN_SECONDS = 60

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const VIEW_COPY: Record<ViewState, {
  eyebrow: string
  title: string
  description: string
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  mobileHeroTitle: string
  heroMode: 'product' | 'email' | 'success' | 'security' | 'expired'
  heroFooter?: string
}> = {
  login: {
    eyebrow: 'Bem-vindo de volta',
    title: 'Entre no Cérebro',
    description: 'Retome suas decisões, metas e rotina financeira de onde parou.',
    heroEyebrow: 'Cérebro Personal',
    heroTitle: 'Tudo o que importa, no lugar certo.',
    heroDescription: 'Seu patrimônio, metas e decisões financeiras ganham contexto — sem transformar sua vida em uma planilha.',
    mobileHeroTitle: 'Tudo o que importa, no lugar certo.',
    heroMode: 'product',
  },
  register: {
    eyebrow: 'Seu espaço começa aqui',
    title: 'Crie sua conta',
    description: 'Comece pelo essencial. Você poderá personalizar o restante depois.',
    heroEyebrow: 'Cérebro Personal',
    heroTitle: 'Seu dinheiro, metas e rotina em um só lugar.',
    heroDescription: 'Mais do que registrar números: o Cérebro conecta contexto e transforma informação em próximos passos.',
    mobileHeroTitle: 'Seu dinheiro e suas metas, no mesmo lugar.',
    heroMode: 'product',
  },
  'confirm-email': {
    eyebrow: 'Verificação de conta',
    title: 'Confirme seu e-mail',
    description: 'Clique no link para ativar sua conta e começar a usar o Cérebro.',
    heroEyebrow: 'Identidade & segurança',
    heroTitle: 'Um passo entre você e uma vida mais clara.',
    heroDescription: 'Você já escolheu começar. Agora falta apenas confirmar que este e-mail é realmente seu.',
    mobileHeroTitle: 'Só falta confirmar.',
    heroMode: 'email',
    heroFooter: 'Segurança que protege sem complicar.',
  },
  confirmed: {
    eyebrow: 'Conta ativada',
    title: 'E-mail confirmado',
    description: 'Sua conta foi ativada com sucesso. Seu espaço está pronto.',
    heroEyebrow: 'Espaço ativado',
    heroTitle: 'Tudo pronto. Agora o contexto começa a trabalhar por você.',
    heroDescription: 'A confirmação termina aqui. A partir de agora, o produto assume o protagonismo.',
    mobileHeroTitle: 'Tudo pronto.',
    heroMode: 'success',
    heroFooter: 'Segurança que protege sem complicar.',
  },
  forgot: {
    eyebrow: 'Recuperação de acesso',
    title: 'Recupere sua senha',
    description: 'Informe seu e-mail. Se houver uma conta correspondente, enviaremos as instruções com segurança.',
    heroEyebrow: 'Acesso seguro',
    heroTitle: 'Volte ao controle com segurança.',
    heroDescription: 'A recuperação é curta, previsível e não expõe informações sobre a sua conta.',
    mobileHeroTitle: 'Volte ao controle.',
    heroMode: 'security',
    heroFooter: 'Proteção sem ruído. Controle sem fricção.',
  },
  'recovery-sent': {
    eyebrow: 'Instruções enviadas',
    title: 'Confira seu e-mail',
    description: 'Se houver uma conta correspondente, enviamos as instruções para redefinir sua senha.',
    heroEyebrow: 'Recuperação em andamento',
    heroTitle: 'O próximo passo já está a caminho.',
    heroDescription: 'Abra a mensagem quando chegar. O Cérebro mantém o processo simples e o contexto protegido.',
    mobileHeroTitle: 'Já está a caminho.',
    heroMode: 'email',
    heroFooter: 'Proteção sem ruído. Controle sem fricção.',
  },
  'link-expired': {
    eyebrow: 'Link expirado',
    title: 'Este link expirou',
    description: 'Links de recuperação têm prazo para proteger sua conta. Solicite um novo e continue daqui.',
    heroEyebrow: 'Prazo de segurança',
    heroTitle: 'Links seguros têm prazo.',
    heroDescription: 'Isso reduz o risco de reutilização indevida. Solicitar outro link leva só alguns segundos.',
    mobileHeroTitle: 'Links seguros têm prazo.',
    heroMode: 'expired',
    heroFooter: 'Proteção sem ruído. Controle sem fricção.',
  },
}

export default function AuthPage() {
  const [view, setView] = useState<ViewState>('login')
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' })
  const [authError, setAuthError] = useState<string | null>(null)
  const [resendFeedback, setResendFeedback] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const copy = VIEW_COPY[view]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const state = params.get('state')
    const authErrorParam = params.get('auth_error')

    if (state === 'confirmed') setView('confirmed')
    if (state === 'link-expired') setView('link-expired')
    if (state === 'forgot') setView('forgot')

    if (authErrorParam === 'oauth') {
      setView('login')
      setAuthError('Não foi possível concluir o acesso com Google. Você pode tentar novamente.')
      const emailDraft = window.sessionStorage.getItem(GOOGLE_EMAIL_DRAFT_KEY)
      if (emailDraft) setFormData((current) => ({ ...current, email: emailDraft }))
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  function switchView(nextView: ViewState, { preserveEmail = true }: { preserveEmail?: boolean } = {}) {
    setAuthError(null)
    setResendFeedback(null)
    setView(nextView)
    setFormData((current) => ({
      fullName: '',
      email: preserveEmail ? current.email : '',
      password: '',
    }))
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError(null)
    setLoadingAction('form')

    try {
      if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/nova-senha`,
        })
        if (error) throw new Error('Não foi possível enviar as instruções agora. Tente novamente em instantes.')
        setView('recovery-sent')
        setCooldown(RESEND_COOLDOWN_SECONDS)
        return
      }

      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw new Error('Não foi possível entrar. Verifique seus dados e tente novamente.')
        router.push('/app')
        return
      }

      if (view === 'register') {
        if (formData.fullName.trim().length < 2) {
          throw new Error('Informe como você quer ser chamado.')
        }
        if (formData.password.length < 8) {
          throw new Error('A senha deve ter pelo menos 8 caracteres.')
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              full_name: formData.fullName.trim(),
              avatar_url: '',
            },
          },
        })
        if (error) throw new Error('Não foi possível criar sua conta agora. Revise os dados e tente novamente.')

        if (!data.session) {
          setView('confirm-email')
          setCooldown(RESEND_COOLDOWN_SECONDS)
          return
        }

        router.push('/app')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível concluir esta ação. Tente novamente.'
      setAuthError(message)
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleGoogleLogin() {
    if (loadingAction) return
    setAuthError(null)
    setLoadingAction('google')
    window.sessionStorage.setItem(GOOGLE_EMAIL_DRAFT_KEY, formData.email)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setAuthError('Não foi possível abrir o Google. Tente novamente.')
      setLoadingAction(null)
    }
  }

  async function resendSignupConfirmation() {
    if (!formData.email || cooldown > 0 || loadingAction) return
    setLoadingAction('resend')
    setResendFeedback(null)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      setResendFeedback('Não foi possível reenviar agora. Tente novamente em instantes.')
    } else {
      setResendFeedback('Novo e-mail enviado.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    }
    setLoadingAction(null)
  }

  async function resendRecovery() {
    if (!formData.email || cooldown > 0 || loadingAction) return
    setLoadingAction('resend')
    setResendFeedback(null)

    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })

    if (error) {
      setResendFeedback('Não foi possível reenviar agora. Tente novamente em instantes.')
    } else {
      setResendFeedback('Novas instruções foram enviadas, se houver uma conta correspondente.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    }
    setLoadingAction(null)
  }

  return (
    <AuthExperienceShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      heroEyebrow={copy.heroEyebrow}
      heroTitle={copy.heroTitle}
      heroDescription={copy.heroDescription}
      mobileHeroTitle={copy.mobileHeroTitle}
      heroMode={copy.heroMode}
      heroFooter={copy.heroFooter}
      contentClassName={view === 'register' ? 'lg:py-2' : undefined}
    >
      {view === 'login' || view === 'register' || view === 'forgot' ? (
        <div className="space-y-5">
          {view !== 'forgot' ? (
            <>
              <Button
                type="button"
                variant="secondary"
                className="relative w-full gap-3"
                disabled={Boolean(loadingAction)}
                onClick={handleGoogleLogin}
              >
                {loadingAction === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                {loadingAction === 'google' ? 'Abrindo o Google…' : 'Continuar com Google'}
              </Button>
              <div className="flex items-center gap-3 text-[11px] text-[var(--neutral-500)]">
                <span className="h-px flex-1 bg-[var(--neutral-200)]" />
                <span>{view === 'register' ? 'ou cadastre-se com e-mail' : 'ou continue com e-mail'}</span>
                <span className="h-px flex-1 bg-[var(--neutral-200)]" />
              </div>
            </>
          ) : null}

          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'register' ? (
              <Field label="Nome" htmlFor="auth-full-name">
                <Input
                  id="auth-full-name"
                  autoComplete="name"
                  required
                  placeholder="Como você quer ser chamado?"
                  value={formData.fullName}
                  onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                />
              </Field>
            ) : null}

            <Field label="E-mail" htmlFor="auth-email">
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              />
            </Field>

            {view !== 'forgot' ? (
              <Field
                label="Senha"
                htmlFor="auth-password"
                helperText={view === 'register' ? 'Use pelo menos 8 caracteres.' : undefined}
              >
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={view === 'register' ? 'new-password' : 'current-password'}
                  minLength={view === 'register' ? 8 : undefined}
                  required
                  placeholder={view === 'register' ? 'Mínimo de 8 caracteres' : 'Sua senha'}
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                />
                {view === 'login' ? (
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="ml-auto text-xs font-medium text-[var(--brand-500)] transition-colors duration-[var(--motion-duration-fast)] hover:text-[var(--brand-700)]"
                  >
                    Esqueci minha senha
                  </button>
                ) : null}
              </Field>
            ) : null}

            {authError ? (
              <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-status-danger)]/25 bg-[var(--color-status-danger-surface)] px-3 py-2.5 text-xs leading-5 text-[var(--color-status-danger)]">
                {authError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={Boolean(loadingAction)}>
              {loadingAction === 'form' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {view === 'login' ? 'Entrar' : view === 'register' ? 'Criar conta' : 'Enviar instruções'}
            </Button>
          </form>

          {view === 'register' ? (
            <p className="text-[11px] leading-5 text-[var(--neutral-500)]">
              Ao continuar, você concorda com os <Link className="font-medium text-[var(--brand-500)]" href="/termos-uso">Termos de Uso</Link> e a <Link className="font-medium text-[var(--brand-500)]" href="/politica-privacidade">Política de Privacidade</Link>.
            </p>
          ) : null}

          <div className="text-center text-[12px] text-[var(--neutral-600)] lg:text-[13px]">
            {view === 'login' ? (
              <>Ainda não tem conta? <button type="button" className="font-semibold text-[var(--brand-500)]" onClick={() => switchView('register')}>Criar conta</button></>
            ) : view === 'register' ? (
              <>Já tem conta? <button type="button" className="font-semibold text-[var(--brand-500)]" onClick={() => switchView('login')}>Entrar</button></>
            ) : (
              <button type="button" className="font-semibold text-[var(--brand-500)]" onClick={() => switchView('login')}>Voltar para entrar</button>
            )}
          </div>

          <div className="rounded-[14px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-500)]" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-medium text-[var(--neutral-700)] lg:text-xs">
                  {view === 'register' ? 'Você começa simples e evolui quando precisar.' : view === 'forgot' ? 'Por segurança, não informamos se o e-mail possui conta.' : 'Seus dados ficam protegidos e você mantém o controle.'}
                </p>
                <p className="mt-1 text-[10px] text-[var(--neutral-500)] lg:text-[11px]">
                  {view === 'register' ? 'Sem configuração pesada no primeiro acesso.' : view === 'forgot' ? 'O link enviado é temporário e só pode ser usado para redefinir a senha.' : 'Acesso seguro • sem ações silenciosas'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {view === 'confirm-email' ? (
        <div className="space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-700)]">
            <Mail className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-[var(--neutral-600)]">Enviamos um link de confirmação para:</p>
            <p className="mt-2 font-semibold text-[var(--neutral-900)]">{formData.email}</p>
          </div>
          <Button type="button" className="w-full" onClick={() => { window.location.href = 'mailto:' }}>
            Abrir meu e-mail
          </Button>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--neutral-500)]">
              <span>Não recebeu?</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={cooldown > 0 || Boolean(loadingAction)}
                onClick={resendSignupConfirmation}
              >
                {loadingAction === 'resend' ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar e-mail'}
              </Button>
            </div>
            {resendFeedback ? <p role="status" className="text-xs text-[var(--neutral-600)]">{resendFeedback}</p> : null}
          </div>
          <button type="button" className="text-sm font-semibold text-[var(--brand-500)]" onClick={() => switchView('register', { preserveEmail: false })}>
            Usar outro e-mail
          </button>
        </div>
      ) : null}

      {view === 'confirmed' ? (
        <div className="space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]">
            <Check className="h-8 w-8" aria-hidden="true" />
          </div>
          <Button className="w-full" onClick={() => router.push('/app')}>Continuar para o Cérebro</Button>
          <div className="rounded-[14px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
            <p className="text-xs font-medium text-[var(--neutral-700)]">Agora você pode:</p>
            <ul className="mt-3 space-y-2 text-xs text-[var(--neutral-600)]">
              <li>✓ Organizar suas finanças</li>
              <li>✓ Definir e acompanhar metas</li>
              <li>✓ Receber insights contextualizados</li>
            </ul>
          </div>
          <p className="text-sm font-medium text-[var(--neutral-700)]">Bem-vindo ao Cérebro.</p>
        </div>
      ) : null}

      {view === 'recovery-sent' ? (
        <div className="space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-700)]">
            <Mail className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="rounded-[14px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-xs leading-5 text-[var(--neutral-600)]">
            O link possui prazo de validade. Se ele expirar, você poderá solicitar outro.
          </div>
          <Button type="button" className="w-full" onClick={() => switchView('login')}>Voltar para entrar</Button>
          <button
            type="button"
            disabled={cooldown > 0 || Boolean(loadingAction)}
            onClick={resendRecovery}
            className="text-sm font-semibold text-[var(--brand-500)] disabled:text-[var(--color-text-disabled)]"
          >
            {cooldown > 0 ? `Reenviar instruções em ${cooldown}s` : 'Reenviar instruções'}
          </button>
          {resendFeedback ? <p role="status" className="text-xs text-[var(--neutral-600)]">{resendFeedback}</p> : null}
        </div>
      ) : null}

      {view === 'link-expired' ? (
        <div className="space-y-6">
          <div className="rounded-[14px] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-xs leading-5 text-[var(--neutral-600)]">
            <strong className="block text-[var(--neutral-700)]">Nada foi alterado na sua conta.</strong>
            <span className="mt-1 block">Um novo link substitui o anterior e mantém o processo seguro.</span>
          </div>
          <Button type="button" className="w-full" onClick={() => switchView('forgot')}>Solicitar novo link</Button>
          <button type="button" className="text-sm font-semibold text-[var(--brand-500)]" onClick={() => switchView('login')}>Voltar para entrar</button>
        </div>
      ) : null}
    </AuthExperienceShell>
  )
}
