'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { Check, Clock3, LockKeyhole, Mail } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { CerebroLogo } from '@/core/brand/CerebroLogo'
import { BalanceCard } from '@/core/finance-ui/BalanceCard'
import { FinancialMetricCard } from '@/core/finance-ui/FinancialMetricCard'
import { GoalProgress } from '@/core/finance-ui/GoalProgress'
import { cn } from '@/lib/utils'

type AuthHeroMode = 'product' | 'email' | 'success' | 'security' | 'password' | 'expired'

type AuthExperienceShellProps = {
  children: ReactNode
  eyebrow: string
  title: string
  description: string
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  mobileHeroTitle: string
  heroFooter?: string
  heroMode?: AuthHeroMode
  contentClassName?: string
}

const AUTH_LIGHT_SEMANTICS = {
  '--color-bg-canvas': 'var(--neutral-50)',
  '--color-bg-surface': 'var(--neutral-0)',
  '--color-card-fill': 'var(--neutral-0)',
  '--color-card-border': 'var(--neutral-200)',
  '--color-card-accent-fill': 'var(--brand-100)',
  '--color-card-accent-border': 'var(--brand-300)',
  '--color-text-primary': 'var(--neutral-900)',
  '--color-text-secondary': 'var(--neutral-500)',
  '--color-text-helper': 'var(--neutral-500)',
  '--color-text-placeholder': 'var(--neutral-600)',
  '--color-text-disabled': 'var(--neutral-500)',
  '--color-text-on-action': 'var(--neutral-0)',
  '--color-action-primary': 'var(--brand-500)',
  '--color-action-primary-hover': 'var(--brand-600)',
  '--color-action-primary-pressed': 'var(--brand-700)',
  '--color-action-secondary-fill': 'var(--neutral-0)',
  '--color-action-secondary-border': 'var(--neutral-200)',
  '--color-action-secondary-hover': 'var(--neutral-100)',
  '--color-action-secondary-pressed': 'var(--neutral-200)',
  '--color-action-disabled-fill': 'var(--neutral-200)',
  '--color-field-fill': 'var(--neutral-0)',
  '--color-field-fill-disabled': 'var(--neutral-100)',
  '--color-field-border': 'var(--neutral-300)',
  '--color-field-border-hover': 'var(--neutral-400)',
  '--color-field-border-focus': 'var(--brand-500)',
  '--color-focus-ring': 'var(--brand-500)',
  '--color-status-success': 'var(--success-700)',
  '--color-status-success-surface': 'var(--success-100)',
  '--color-status-warning': 'var(--warning-700)',
  '--color-status-warning-surface': 'var(--warning-100)',
  '--color-status-danger': 'var(--danger-700)',
  '--color-status-danger-surface': 'var(--danger-100)',
  '--color-status-ai': 'var(--ai-600)',
  '--color-status-ai-surface': 'var(--ai-100)',
  '--color-progress-track': 'var(--neutral-200)',
  '--color-progress-active': 'var(--brand-500)',
} as CSSProperties

function ProductStage() {
  return (
    <div className="relative h-[470px] w-full max-w-[800px] overflow-hidden rounded-[28px] border border-[var(--neutral-700)] bg-[var(--neutral-950)]">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--neutral-700)_1px,transparent_1px),linear-gradient(90deg,var(--neutral-700)_1px,transparent_1px)] [background-size:92px_92px]" />
      <div className="absolute left-[5%] top-[16%] w-[440px] origin-top-left rotate-2 scale-[0.78]">
        <BalanceCard
          total={48260.4}
          available={18420.1}
          invested={29840.3}
          changeLabel="+8,4%"
        />
      </div>
      <div className="absolute right-[2%] top-[7%] w-[260px] origin-top-right -rotate-2 scale-[0.82]">
        <FinancialMetricCard
          label="Receitas"
          value="R$ 8.420,00"
          delta="+8,4%"
          tone="positive"
          helper="vs. mês anterior"
        />
      </div>
      <div className="absolute right-[-2%] top-[43%] w-[330px] origin-top-right -rotate-1 scale-[0.82]">
        <GoalProgress
          title="Reserva de emergência"
          current={10200}
          target={15000}
          helper="No ritmo"
        />
      </div>
      <div className="absolute bottom-[8%] left-[40%] w-[280px] rotate-1 rounded-[20px] border border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] p-5 shadow-xl">
        <span className="rounded-full bg-[var(--color-status-ai-surface)] px-2 py-1 text-[10px] font-medium text-[var(--color-status-ai)]">
          Insight do Cérebro
        </span>
        <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">Sua meta teve progresso recente</p>
        <p className="mt-2 text-xs leading-4 text-[var(--color-text-secondary)]">
          Continue acompanhando a evolução para manter o contexto das suas decisões.
        </p>
      </div>
      <span className="absolute left-6 top-4 rounded-full border border-[var(--neutral-700)] bg-[var(--neutral-900)] px-4 py-2 text-[11px] text-[var(--neutral-300)]">
        Atualizado agora
      </span>
      <span className="absolute bottom-8 right-8 rounded-full border border-[var(--neutral-700)] bg-[var(--neutral-900)] px-4 py-2 text-[11px] text-[var(--neutral-300)]">
        Contexto sob seu controle
      </span>
    </div>
  )
}

function StateStage({ mode }: { mode: Exclude<AuthHeroMode, 'product'> }) {
  const visual = {
    email: {
      icon: Mail,
      title: 'Confirme seu e-mail',
      body: 'Só falta confirmar seu endereço para ativar o seu espaço no Cérebro.',
      action: 'Confirmar e-mail',
    },
    success: {
      icon: Check,
      title: 'Seu espaço está ativo',
      body: 'Entre e comece pelo que importa hoje.',
      action: 'Conta ativada',
    },
    security: {
      icon: LockKeyhole,
      title: 'Recuperação protegida',
      body: 'Link único, prazo limitado e nenhuma exposição de dados da conta.',
      action: 'Acesso seguro',
    },
    password: {
      icon: LockKeyhole,
      title: 'Sua nova senha',
      body: '••••••••••••',
      action: 'Força da senha · Forte',
    },
    expired: {
      icon: Clock3,
      title: 'Links seguros têm prazo',
      body: 'Um novo link substitui o anterior e mantém o processo protegido.',
      action: 'Solicitar novo link',
    },
  }[mode]
  const Icon = visual.icon

  return (
    <div className="relative flex h-[450px] w-full max-w-[740px] items-center justify-center overflow-hidden rounded-[28px]">
      <div className="absolute h-[380px] w-[380px] rounded-full border border-[var(--brand-300)]/20" />
      <div className="absolute h-[290px] w-[290px] rounded-full border border-[var(--brand-300)]/30" />
      <div className="absolute h-[210px] w-[210px] rounded-full bg-[var(--brand-500)]/20 blur-3xl" />
      <div className="relative w-[500px] rounded-[24px] border border-[var(--neutral-200)] bg-white p-8 shadow-2xl">
        <CerebroLogo variant="lockup" theme="light" height={40} />
        <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-100)] text-[var(--brand-700)]">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-[-0.4px] text-[var(--neutral-900)]">{visual.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--neutral-600)]">{visual.body}</p>
        <div className="mt-7 inline-flex rounded-[12px] bg-[var(--brand-500)] px-5 py-3 text-sm font-semibold text-white">
          {visual.action}
        </div>
      </div>
    </div>
  )
}

function MobileHero({ title, mode }: { title: string; mode: AuthHeroMode }) {
  const stateIcon = {
    product: null,
    email: Mail,
    success: Check,
    security: LockKeyhole,
    password: LockKeyhole,
    expired: Clock3,
  }[mode]
  const StateIcon = stateIcon

  return (
    <div className="relative h-[190px] overflow-hidden bg-[var(--neutral-950)] px-6 pt-5 lg:hidden">
      <div className="absolute -right-16 -top-20 h-[210px] w-[210px] rounded-full bg-[var(--brand-500)]" />
      <div className="absolute -bottom-24 -left-20 h-[190px] w-[190px] rounded-full bg-[var(--neutral-900)]" />
      <CerebroLogo variant="lockup" theme="dark" height={33} className="relative z-10" priority />
      <h2 className="relative z-10 mt-5 max-w-[245px] text-[24px] font-bold leading-[1.15] tracking-[-0.5px] text-white">
        {title}
      </h2>
      {mode === 'product' ? (
        <div className="absolute bottom-5 right-7 z-10 w-[112px] rounded-xl border border-[var(--neutral-200)] bg-white p-3 shadow-xl">
          <p className="text-[6px] font-medium text-[var(--neutral-500)]">Receitas</p>
          <strong className="mt-1 block text-[11px] text-[var(--neutral-900)]">R$ 8.420,00</strong>
          <span className="mt-1 inline-block rounded-full bg-[var(--color-status-success-surface)] px-1.5 py-0.5 text-[5px] text-[var(--color-status-success)]">+8,4%</span>
        </div>
      ) : StateIcon ? (
        <div className="absolute bottom-5 right-8 z-10 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--brand-300)]/40 bg-[var(--brand-500)]/20 text-[var(--brand-300)]">
          <StateIcon className="h-7 w-7" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  )
}

export function AuthExperienceShell({
  children,
  eyebrow,
  title,
  description,
  heroEyebrow,
  heroTitle,
  heroDescription,
  mobileHeroTitle,
  heroFooter = 'Mais clareza hoje. Um amanhã mais intencional.',
  heroMode = 'product',
  contentClassName,
}: AuthExperienceShellProps) {
  const reduceMotion = useReducedMotion()

  return (
    <main className="min-h-screen bg-[var(--neutral-0)] text-[var(--neutral-900)]" style={AUTH_LIGHT_SEMANTICS}>
      <MobileHero title={mobileHeroTitle} mode={heroMode} />
      <div className="mx-auto min-h-[calc(100vh-190px)] max-w-[1440px] lg:grid lg:min-h-screen lg:grid-cols-[520px_minmax(0,1fr)]">
        <section className="relative flex min-h-[calc(100vh-190px)] flex-col bg-white px-6 pb-6 pt-6 sm:px-10 lg:min-h-screen lg:px-14 lg:pb-12 lg:pt-[46px]">
          <CerebroLogo variant="lockup" theme="light" height={55} className="hidden lg:inline-flex" priority />

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className={cn('my-auto w-full max-w-[392px] py-6 lg:py-8', contentClassName)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--brand-700)] lg:text-[11px]">{eyebrow}</p>
            <h1 className="mt-3 text-[30px] font-bold leading-[1.12] tracking-[-0.7px] text-[var(--neutral-900)] lg:text-[36px]">{title}</h1>
            <p className="mt-2 text-[13px] leading-5 text-[var(--neutral-600)] lg:text-[15px]">{description}</p>
            <div className="mt-7">{children}</div>
          </motion.div>

          <footer className="mt-auto flex items-center gap-4 pt-5 text-[10px] font-medium text-[var(--neutral-500)] lg:text-[12px]">
            <Link href="/politica-privacidade" className="transition-colors duration-[var(--motion-duration-fast)] hover:text-[var(--brand-500)]">Privacidade</Link>
            <Link href="/termos-uso" className="transition-colors duration-[var(--motion-duration-fast)] hover:text-[var(--brand-500)]">Termos de Uso</Link>
            <span className="ml-auto hidden text-[var(--neutral-400)] lg:inline">© Cérebro</span>
          </footer>
        </section>

        <aside className="relative hidden min-h-screen overflow-hidden bg-[var(--neutral-950)] px-16 py-14 text-white lg:flex lg:flex-col">
          <div className="absolute -right-44 -top-40 h-[430px] w-[430px] rounded-full bg-[var(--neutral-900)]" />
          <div className="absolute -bottom-52 -left-44 h-[420px] w-[420px] rounded-full bg-[var(--neutral-900)]" />
          <div className="absolute right-[8%] top-[38%] h-[420px] w-[420px] rounded-full bg-[var(--brand-500)] opacity-95" />
          <div className="absolute left-[43%] top-[42%] h-[360px] w-[360px] rounded-full bg-[var(--ai-600)]/20 blur-[120px]" />

          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--brand-300)]">{heroEyebrow}</p>
            <h2 className="mt-8 max-w-[760px] text-[clamp(2.5rem,3.4vw,3rem)] font-bold leading-[1.1] tracking-[-1px] text-white">{heroTitle}</h2>
            <p className="mt-5 max-w-[660px] text-lg leading-7 text-[var(--neutral-300)]">{heroDescription}</p>
          </div>

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: 'easeOut', delay: reduceMotion ? 0 : 0.06 }}
            className="relative z-10 mt-auto mb-8 flex justify-center"
          >
            {heroMode === 'product' ? <ProductStage /> : <StateStage mode={heroMode} />}
          </motion.div>

          <p className="relative z-10 text-xs font-medium text-[var(--neutral-400)]">{heroFooter}</p>
        </aside>
      </div>
    </main>
  )
}
