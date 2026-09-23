'use client'

import React, { useEffect, useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BrainCircuit,
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  Loader2,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  Star,
  Target,
  Trash2,
  User,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserProfile } from '@/types_db'
import UpgradeModal from '@/core/components/UpgradeModal'
import { useEntitlements } from '@/core/hooks/useEntitlements'
import { financeService } from '@/services/financeService'
import { Button } from '@/core/ui/button'
import { Input } from '@/core/ui/input'

interface PremiumCardProps {
  children: ReactNode
  className?: string
}

interface MenuOptionProps {
  icon: LucideIcon
  label: string
  value?: string
  destructive?: boolean
  onClick: () => void
}

const PremiumCard = ({ children, className = '' }: PremiumCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={`group relative overflow-hidden rounded-[2rem] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] shadow-[var(--shadow-card)] ${className}`}
  >
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-card-accent-fill)]/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    <div className="relative z-10 flex h-full flex-col p-6 md:p-8">{children}</div>
  </motion.div>
)

const MenuOption = ({ icon: Icon, label, value, destructive = false, onClick }: MenuOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between border-b border-[var(--color-card-border)] p-5 text-left transition-colors last:border-0 hover:bg-[var(--color-action-ghost-hover)] active:bg-[var(--color-action-ghost-pressed)]"
  >
    <div className="flex items-center gap-4">
      <div className={`rounded-xl bg-[var(--color-bg-elevated)] p-2.5 transition-colors ${destructive ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-helper)] group-hover:text-[var(--color-text-primary)]'}`}>
        <Icon size={20} />
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${destructive ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-primary)]'}`}>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value ? <span className="text-[10px] font-bold uppercase text-[var(--color-text-helper)]">{value}</span> : null}
      <ChevronRight size={14} className="text-[var(--color-text-helper)] transition-colors group-hover:text-[var(--color-text-primary)]" />
    </div>
  </button>
)

export default function ProfileView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { plan } = useEntitlements()
  const [iaEnabled, setIaEnabled] = useState(true)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [, setIsNotificationsModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [pushNotif] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
        } else {
          setProfile({
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            avatar_url: user.user_metadata?.avatar_url,
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    void fetchProfile()
  }, [supabase])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await financeService.updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
      })
      toast.success('Perfil sincronizado!', { icon: <CheckCircle2 className="text-[var(--color-status-success)]" /> })
      setIsEditing(false)
    } catch (error: unknown) {
      toast.error(`Falha ao salvar: ${error instanceof Error ? error.message : 'erro inesperado'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 8) return toast.error('A senha deve ter pelo menos 8 caracteres.')
    if (newPassword !== confirmPassword) return toast.error('Senhas divergentes.')
    setPassLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Segurança reforçada!')
      setIsPasswordModalOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Erro na atualização.')
    } finally {
      setPassLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handlePlanAction = async () => {
    if (plan === 'free') {
      setShowUpgradeModal(true)
      return
    }

    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json() as { url?: string; error?: { message?: string } }
      if (!response.ok || !data.url) throw new Error(data.error?.message || 'Não foi possível abrir o portal.')
      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível abrir o portal.')
      setPortalLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/account/export', { cache: 'no-store' })
      if (!response.ok) throw new Error('Não foi possível exportar seus dados.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cerebro-ia-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Exportação concluída.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha na exportação.')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR') return
    setDeleting(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Não foi possível excluir sua conta.')
      window.location.href = '/login'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha na exclusão.')
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center bg-[var(--color-bg-canvas)]"><Loader2 className="animate-spin text-[var(--color-action-primary)]" size={32} /></div>
  }

  const isPro = plan === 'pro' || plan === 'premium'

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-8 bg-[var(--color-bg-canvas)] p-4 pb-32 text-[var(--color-text-primary)] md:p-8">
      <header className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Configurações</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-[var(--color-text-helper)]">Dados pessoais e preferências da conta</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-status-success)]/25 bg-[var(--color-status-success-surface)] px-5 py-3">
          <ShieldCheck size={18} className="text-[var(--color-status-success)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-status-success)]">Ativos criptografados</span>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <PremiumCard className="items-center text-center">
            <div className="group/avatar relative mb-6 cursor-pointer">
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--color-bg-surface)] bg-gradient-to-br from-indigo-500 to-purple-700 shadow-[var(--shadow-card-strong)] transition-transform group-hover:scale-105">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" width={128} height={128} unoptimized className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl font-black uppercase text-white/70">{profile.full_name?.charAt(0) || 'U'}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 backdrop-blur-sm transition-opacity group-hover/avatar:opacity-100"><Camera size={26} className="text-white" /></div>
              </div>
            </div>
            <h2 className="w-full truncate text-2xl font-black tracking-tight">{profile.full_name || 'Usuário'}</h2>
            <p className="mt-2 text-xs lowercase tracking-wide text-[var(--color-text-helper)]">{profile.email}</p>
            <div className="mt-7 h-px w-full bg-[var(--color-card-border)]" />
            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-helper)]">Célula financeira desde {profile.created_at ? new Date(profile.created_at).getFullYear() : '2024'}</p>
          </PremiumCard>

          <PremiumCard>
            <div className="mb-7 flex items-center justify-between">
              <div className={`rounded-2xl p-4 ${isPro ? 'bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-ai-surface)] text-[var(--color-status-ai)]'}`}>
                {isPro ? <Star size={24} /> : <Zap size={24} />}
              </div>
              <span className={`rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isPro ? 'border-[var(--color-status-success)]/25 bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]' : 'border-[var(--color-card-accent-border)] bg-[var(--color-status-ai-surface)] text-[var(--color-status-ai)]'}`}>
                Cérebro {plan.toUpperCase()}
              </span>
            </div>
            <h3 className="mb-3 text-lg font-black">Nível de processamento</h3>
            <p className="mb-7 text-xs font-medium leading-relaxed text-[var(--color-text-secondary)]">
              {isPro ? 'Recursos do plano PRO ativados.' : 'Recursos essenciais ativos. Faça upgrade para ampliar análises e limites.'}
            </p>
            <Button type="button" variant={isPro ? 'secondary' : 'default'} disabled={portalLoading} onClick={handlePlanAction} className="w-full rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.16em]">
              {portalLoading ? 'Abrindo Stripe…' : isPro ? 'Configurar plano' : 'Ativar versão PRO'}
            </Button>
          </PremiumCard>

          <section className="overflow-hidden rounded-[2rem] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] shadow-[var(--shadow-card)]" aria-label="Hardware e segurança">
            <p className="px-6 pb-2 pt-6 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text-helper)]">Hardware & Segurança</p>
            <MenuOption icon={Lock} label="Blindar senha" onClick={() => setIsPasswordModalOpen(true)} />
            <MenuOption icon={Bell} label="Fluxo de alertas" value={pushNotif ? 'Ativos' : 'Mudos'} onClick={() => setIsNotificationsModalOpen(true)} />
            <MenuOption icon={LogOut} label="Terminar sessão" destructive onClick={handleLogout} />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <PremiumCard>
            <div className="mb-8 flex items-center justify-between border-b border-[var(--color-card-border)] pb-6">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[var(--color-status-ai-surface)] p-3 text-[var(--color-status-ai)]"><User size={20} /></div>
                <h2 className="text-xl font-black tracking-tight">Perímetro do perfil</h2>
              </div>
              {!isEditing ? <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Modificar</Button> : null}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-7">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-helper)]">
                  <span>Nome completo</span>
                  <Input name="full_name" value={profile.full_name || ''} onChange={handleChange} required disabled={!isEditing} className="text-sm font-semibold normal-case tracking-normal" />
                </label>
                <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-helper)]">
                  <span>Telefone de segurança</span>
                  <Input name="phone" value={profile.phone || ''} onChange={handleChange} disabled={!isEditing} placeholder="(00) 00000-0000" className="text-sm normal-case tracking-normal" />
                </label>
              </div>

              <label className="block space-y-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-helper)]">
                <span className="flex items-center gap-2"><Target size={12} className="text-[var(--color-action-ai)]" /> Diretriz financeira principal</span>
                <textarea name="bio" value={profile.bio || ''} onChange={handleChange} disabled={!isEditing} rows={3} className="w-full resize-none rounded-2xl border border-[var(--color-field-border)] bg-[var(--color-field-fill)] p-4 text-sm font-medium normal-case tracking-normal text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-field-border-focus)] disabled:bg-[var(--color-field-fill-disabled)] disabled:text-[var(--color-text-disabled)]" placeholder="Conte um pouco sobre seus objetivos financeiros..." />
              </label>

              <div className="border-t border-[var(--color-card-border)] pt-7">
                <h3 className="mb-5 text-xs font-black uppercase tracking-widest">Preferências financeiras</h3>
                <button
                  type="button"
                  aria-pressed={iaEnabled}
                  onClick={() => setIaEnabled(!iaEnabled)}
                  className={`w-full rounded-[1.5rem] border p-5 text-left transition-all md:w-1/2 ${iaEnabled ? 'border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] shadow-[var(--shadow-card)]' : 'border-[var(--color-card-border)] bg-[var(--color-bg-elevated)]'}`}
                >
                  <span className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-4">
                      <BrainCircuit size={24} className={iaEnabled ? 'text-[var(--color-status-ai)]' : 'text-[var(--color-text-helper)]'} />
                      <span><span className="block text-xs font-black uppercase">Motor analítico</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-helper)]">Processamento de dados</span></span>
                    </span>
                    <span className={`relative h-5 w-10 rounded-full transition-colors ${iaEnabled ? 'bg-[var(--color-action-primary)]' : 'bg-[var(--color-action-disabled-fill)]'}`}>
                      <motion.span layout animate={{ x: iaEnabled ? 22 : 2 }} className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
                    </span>
                  </span>
                </button>
              </div>

              <AnimatePresence>
                {isEditing ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col justify-end gap-3 border-t border-[var(--color-card-border)] pt-7 md:flex-row">
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Abortar</Button>
                    <Button type="submit" disabled={saving} className="gap-2"><>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Sincronizar alterações</></Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </form>
          </PremiumCard>

          <PremiumCard>
            <div className="mb-6 border-b border-[var(--color-card-border)] pb-5">
              <h2 className="text-xl font-black tracking-tight">Privacidade e dados</h2>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Baixe uma cópia ou exclua permanentemente sua conta.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={handleExport} disabled={exporting} className="gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-widest">
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exportar meus dados
              </Button>
              <Button type="button" variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-widest">
                <Trash2 size={16} /> Excluir minha conta
              </Button>
            </div>
          </PremiumCard>
        </div>
      </div>

      <AnimatePresence>
        {isPasswordModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-md">
            <motion.div role="dialog" aria-modal="true" aria-labelledby="password-modal-title" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-[2rem] border border-[var(--color-card-border)] bg-[var(--color-bg-surface)] p-8 shadow-[var(--shadow-floating)]">
              <button type="button" aria-label="Fechar" onClick={() => setIsPasswordModalOpen(false)} className="absolute right-6 top-6 rounded-full p-2 text-[var(--color-text-helper)] transition-colors hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]"><X size={20}/></button>
              <h3 id="password-modal-title" className="mb-2 text-2xl font-black tracking-tight">Atualizar senha</h3>
              <p className="mb-8 text-xs font-medium text-[var(--color-text-secondary)]">Atualize sua chave de acesso ao sistema.</p>
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <label className="block space-y-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-helper)]"><span>Nova senha</span><Input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required placeholder="••••••••" /></label>
                <label className="block space-y-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-helper)]"><span>Confirmar senha</span><Input type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required placeholder="••••••••" /></label>
                <Button type="submit" variant="destructive" disabled={passLoading} className="w-full gap-2 rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.2em]">
                  {passLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Sobrescrever senha
                </Button>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-md">
            <motion.div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-md rounded-[2rem] border border-[var(--color-status-danger)]/25 bg-[var(--color-bg-surface)] p-8 shadow-[var(--shadow-floating)]">
              <h3 id="delete-account-title" className="text-2xl font-black">Excluir conta permanentemente</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">A assinatura será cancelada e seus dados e recibos serão removidos. Esta ação não pode ser desfeita.</p>
              <label className="mt-6 block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-helper)]">Digite EXCLUIR para confirmar</label>
              <Input aria-label="Confirmação de exclusão" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" className="mt-2" />
              <div className="mt-6 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmation('') }} className="flex-1">Cancelar</Button>
                <Button type="button" variant="destructive" onClick={handleDeleteAccount} disabled={deleting || deleteConfirmation !== 'EXCLUIR'} className="flex-1">
                  {deleting ? 'Excluindo…' : 'Excluir definitivamente'}
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
