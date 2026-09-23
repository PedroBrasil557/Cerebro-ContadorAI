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

interface CardProps {
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

const Card = ({ children, className = '' }: CardProps) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`rounded-[var(--radius-xl)] border border-[var(--color-card-border)] bg-[var(--color-card-fill)] shadow-[var(--shadow-surface)] ${className}`}
  >
    {children}
  </motion.section>
)

const MenuOption = ({ icon: Icon, label, value, destructive = false, onClick }: MenuOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between border-b border-[var(--color-card-border)] p-5 text-left transition-colors last:border-0 hover:bg-[var(--color-action-ghost-hover)]"
  >
    <div className="flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${destructive ? 'bg-[var(--color-status-danger-surface)] text-[var(--color-status-danger)]' : 'bg-[var(--color-action-ghost-hover)] text-[var(--color-text-secondary)]'}`}>
        <Icon size={18} />
      </div>
      <span className={`text-xs font-semibold ${destructive ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-primary)]'}`}>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value ? <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-helper)]">{value}</span> : null}
      <ChevronRight size={14} className="text-[var(--color-text-helper)] transition-transform group-hover:translate-x-0.5" />
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
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }))
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
  const fieldClass = 'w-full rounded-2xl border border-[var(--color-field-border)] bg-[var(--color-field-fill)] p-4 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-field-border-focus)] disabled:bg-[var(--color-field-fill-disabled)] disabled:text-[var(--color-text-disabled)]'

  return (
    <div className="mx-auto min-h-full w-full max-w-7xl space-y-8 bg-[var(--color-bg-canvas)] p-4 pb-32 text-[var(--color-text-primary)] md:p-8">
      <header className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-helper)]">Conta Cérebro</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Configurações</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Dados pessoais, segurança e preferências da conta.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-status-success)]/20 bg-[var(--color-status-success-surface)] px-4 py-2.5 text-[var(--color-status-success)]">
          <ShieldCheck size={17} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Dados protegidos</span>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <Card className="p-7 text-center">
            <div className="relative mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full border-4 border-[var(--color-bg-surface)] bg-gradient-to-br from-indigo-500 to-purple-700 shadow-[var(--shadow-surface)]">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" width={112} height={112} unoptimized className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl font-black uppercase text-white/70">{profile.full_name?.charAt(0) || 'U'}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100"><Camera size={24} className="text-white" /></div>
            </div>
            <h2 className="truncate text-xl font-bold">{profile.full_name || 'Usuário'}</h2>
            <p className="mt-1 truncate text-xs text-[var(--color-text-helper)]">{profile.email}</p>
            <p className="mt-5 border-t border-[var(--color-card-border)] pt-5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-helper)]">No Cérebro desde {profile.created_at ? new Date(profile.created_at).getFullYear() : '2024'}</p>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isPro ? 'bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]' : 'bg-[var(--color-card-accent-fill)] text-[var(--color-action-ai)]'}`}>
                {isPro ? <Star size={21} /> : <Zap size={21} />}
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider ${isPro ? 'border-[var(--color-status-success)]/20 bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]' : 'border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)] text-[var(--color-nav-active-text)]'}`}>Cérebro {plan.toUpperCase()}</span>
            </div>
            <h3 className="font-semibold">Seu plano</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{isPro ? 'Recursos do plano PRO ativados.' : 'Recursos essenciais ativos. Faça upgrade para ampliar análises e limites.'}</p>
            <button type="button" disabled={portalLoading} onClick={handlePlanAction} className="mt-5 w-full rounded-xl border border-[var(--color-action-secondary-border)] bg-[var(--color-action-secondary-fill)] px-4 py-3 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-action-secondary-hover)] disabled:opacity-60">
              {portalLoading ? 'Abrindo Stripe…' : isPro ? 'Configurar plano' : 'Conhecer PRO'}
            </button>
          </Card>

          <Card className="overflow-hidden">
            <p className="px-5 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-helper)]">Segurança e sessão</p>
            <MenuOption icon={Lock} label="Alterar senha" onClick={() => setIsPasswordModalOpen(true)} />
            <MenuOption icon={Bell} label="Alertas" value={pushNotif ? 'Ativos' : 'Mudos'} onClick={() => setIsNotificationsModalOpen(true)} />
            <MenuOption icon={LogOut} label="Sair da conta" destructive onClick={handleLogout} />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <Card className="p-6 md:p-8">
            <div className="mb-7 flex items-center justify-between border-b border-[var(--color-card-border)] pb-6">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-card-accent-fill)] text-[var(--color-action-ai)]"><User size={18} /></span><div><h2 className="font-semibold">Dados do perfil</h2><p className="mt-0.5 text-xs text-[var(--color-text-helper)]">Informações usadas na sua conta.</p></div></div>
              {!isEditing ? <button type="button" onClick={() => setIsEditing(true)} className="rounded-xl bg-[var(--color-card-accent-fill)] px-4 py-2 text-xs font-semibold text-[var(--color-nav-active-text)]">Editar</button> : null}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-xs font-medium text-[var(--color-text-secondary)]"><span>Nome completo</span><input name="full_name" value={profile.full_name || ''} onChange={handleChange} required disabled={!isEditing} className={fieldClass} /></label>
                <label className="space-y-2 text-xs font-medium text-[var(--color-text-secondary)]"><span>Telefone</span><input name="phone" value={profile.phone || ''} onChange={handleChange} disabled={!isEditing} className={fieldClass} placeholder="(00) 00000-0000" /></label>
              </div>

              <label className="block space-y-2 text-xs font-medium text-[var(--color-text-secondary)]"><span className="flex items-center gap-2"><Target size={13} className="text-[var(--color-action-ai)]" />Diretriz financeira principal</span><textarea name="bio" value={profile.bio || ''} onChange={handleChange} disabled={!isEditing} rows={3} className={`${fieldClass} resize-none`} placeholder="Conte um pouco sobre seus objetivos financeiros..." /></label>

              <div className="border-t border-[var(--color-card-border)] pt-6">
                <h3 className="text-sm font-semibold">Preferências financeiras</h3>
                <button type="button" onClick={() => setIaEnabled((current) => !current)} aria-pressed={iaEnabled} className={`mt-4 flex w-full max-w-md items-center justify-between rounded-2xl border p-5 text-left transition-colors ${iaEnabled ? 'border-[var(--color-card-accent-border)] bg-[var(--color-card-accent-fill)]' : 'border-[var(--color-card-border)] bg-[var(--color-bg-surface)]'}`}>
                  <div className="flex items-center gap-3"><BrainCircuit size={22} className={iaEnabled ? 'text-[var(--color-action-ai)]' : 'text-[var(--color-text-helper)]'} /><div><p className="text-sm font-semibold">Motor analítico</p><p className="mt-1 text-xs text-[var(--color-text-helper)]">Processamento de contexto financeiro</p></div></div>
                  <span className={`relative h-6 w-11 rounded-full transition-colors ${iaEnabled ? 'bg-[var(--color-action-primary)]' : 'bg-[var(--color-action-disabled-fill)]'}`}><motion.span layout animate={{ x: iaEnabled ? 22 : 3 }} className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm" /></span>
                </button>
              </div>

              <AnimatePresence>
                {isEditing ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col justify-end gap-3 border-t border-[var(--color-card-border)] pt-6 sm:flex-row">
                    <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl border border-[var(--color-action-secondary-border)] bg-[var(--color-action-secondary-fill)] px-6 py-3 text-xs font-semibold hover:bg-[var(--color-action-secondary-hover)]">Cancelar</button>
                    <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-action-primary)] px-6 py-3 text-xs font-semibold text-white hover:bg-[var(--color-action-primary-hover)] disabled:opacity-60">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar alterações</button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </form>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="mb-5 border-b border-[var(--color-card-border)] pb-5"><h2 className="font-semibold">Privacidade e dados</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Baixe uma cópia ou exclua permanentemente sua conta.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleExport} disabled={exporting} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-action-secondary-border)] bg-[var(--color-action-secondary-fill)] px-5 py-4 text-xs font-semibold hover:bg-[var(--color-action-secondary-hover)] disabled:opacity-50">{exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exportar meus dados</button>
              <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-status-danger)]/20 bg-[var(--color-status-danger-surface)] px-5 py-4 text-xs font-semibold text-[var(--color-status-danger)]"><Trash2 size={16} /> Excluir minha conta</button>
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {isPasswordModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-md">
            <motion.div role="dialog" aria-modal="true" aria-labelledby="password-dialog-title" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-[2rem] border border-[var(--color-card-border)] bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-elevated)]">
              <button type="button" aria-label="Fechar" onClick={() => setIsPasswordModalOpen(false)} className="absolute right-6 top-6 rounded-full p-2 text-[var(--color-text-helper)] hover:bg-[var(--color-action-ghost-hover)] hover:text-[var(--color-text-primary)]"><X size={20}/></button>
              <h3 id="password-dialog-title" className="text-xl font-bold">Alterar senha</h3>
              <p className="mb-7 mt-2 text-sm text-[var(--color-text-secondary)]">Defina uma nova senha com pelo menos 8 caracteres.</p>
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <label className="block space-y-2 text-xs font-medium"><span>Nova senha</span><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" className={fieldClass} /></label>
                <label className="block space-y-2 text-xs font-medium"><span>Confirmar senha</span><input type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" className={fieldClass} /></label>
                <button type="submit" disabled={passLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-action-primary)] py-4 text-xs font-semibold text-white hover:bg-[var(--color-action-primary-hover)] disabled:opacity-60">{passLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Atualizar senha</button>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-md">
            <motion.div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-md rounded-[2rem] border border-[var(--color-status-danger)]/25 bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-elevated)]">
              <h3 id="delete-account-title" className="text-xl font-bold">Excluir conta permanentemente</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">A assinatura será cancelada e seus dados e recibos serão removidos. Esta ação não pode ser desfeita.</p>
              <label className="mt-6 block text-xs font-medium text-[var(--color-text-secondary)]">Digite EXCLUIR para confirmar</label>
              <input aria-label="Confirmação de exclusão" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" className={`${fieldClass} mt-2 focus:border-[var(--color-status-danger)]`} />
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmation('') }} className="flex-1 rounded-xl border border-[var(--color-action-secondary-border)] bg-[var(--color-action-secondary-fill)] py-3 text-xs font-semibold">Cancelar</button>
                <button type="button" onClick={handleDeleteAccount} disabled={deleting || deleteConfirmation !== 'EXCLUIR'} className="flex-1 rounded-xl bg-[var(--color-action-destructive)] py-3 text-xs font-semibold text-white disabled:opacity-40">{deleting ? 'Excluindo…' : 'Excluir definitivamente'}</button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
