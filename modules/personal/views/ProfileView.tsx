'use client'

import React, { useState, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Star,
  Camera, Loader2, Zap, Save, CheckCircle2,
  BrainCircuit, ShieldCheck, Lock, Bell, LogOut, ChevronRight, Target, X,
  Download, Trash2,
  type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { UserProfile } from '@/types_db'
import UpgradeModal from '@/core/components/UpgradeModal' // ✅ CORRIGIDO: Importação adicionada
import { useEntitlements } from '@/core/hooks/useEntitlements'
import { financeService } from '@/services/financeService'

interface PremiumCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

interface MenuOptionProps {
  icon: LucideIcon
  label: string
  value?: string
  color?: string
  onClick: () => void
}

const PremiumCard = ({ children, className = "", glowColor = "from-indigo-500/5" }: PremiumCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
    className={`relative group bg-[#09090b]/40 backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl ${className}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />
    <div className="relative z-10 h-full p-8 flex flex-col">
      {children}
    </div>
  </motion.div>
)

const MenuOption = ({ icon: Icon, label, value, color = "text-white", onClick }: MenuOptionProps) => (
    <button 
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition active:bg-white/10 group border-b border-white/5 last:border-0"
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 bg-white/5 rounded-xl text-gray-400 group-hover:${color === 'text-rose-500' ? 'text-rose-500' : 'text-white'} transition-colors`}>
                <Icon size={20} />
            </div>
            <span className={`font-black text-[10px] uppercase tracking-widest ${color}`}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-[10px] text-gray-500 font-bold uppercase">{value}</span>}
            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
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

  const supabase = createClient()

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
                avatar_url: user.user_metadata?.avatar_url
            })
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await financeService.updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
      })
      toast.success("Perfil sincronizado!", { icon: <CheckCircle2 className="text-emerald-500" /> })
      setIsEditing(false)
    } catch (error: unknown) {
      toast.error(`Falha ao salvar: ${error instanceof Error ? error.message : 'erro inesperado'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault()
      if (newPassword.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres.")
      if (newPassword !== confirmPassword) return toast.error("Senhas divergentes.")
      setPassLoading(true)
      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword })
          if (error) throw error
          toast.success("Segurança reforçada!")
          setIsPasswordModalOpen(false)
          setNewPassword(''); setConfirmPassword('')
      } catch {
          toast.error("Erro na atualização.")
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
      const data = await response.json() as {
        url?: string
        error?: { message?: string }
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error?.message || 'Não foi possível abrir o portal.')
      }
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
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
  }

  const isPro = plan === 'pro' || plan === 'premium'

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 space-y-10 pb-32 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">Configurações</h1>
            <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">Identidade Digital e Parâmetros do Cérebro.IA</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Ativos Criptografados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-4 space-y-8">
            
            <PremiumCard glowColor="from-indigo-500/10" className="flex flex-col items-center text-center">
                <div className="relative group/avatar cursor-pointer mb-8">
                    <div className="w-36 h-36 rounded-full border-4 border-[#09090b] shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform">
                        {profile.avatar_url ? (
                            <Image src={profile.avatar_url} alt="Avatar" width={144} height={144} unoptimized className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl font-black text-white/40 uppercase">{profile.full_name?.charAt(0) || 'U'}</span>
                        )}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-sm">
                            <Camera size={28} className="text-white" />
                        </div>
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic truncate w-full">{profile.full_name || 'Usuário'}</h2>
                <p className="text-xs font-mono text-gray-500 mt-2 tracking-widest lowercase">{profile.email}</p>
                <div className="mt-8 w-full h-px bg-white/5" />
                <p className="mt-6 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Célula Financeira desde {profile.created_at ? new Date(profile.created_at).getFullYear() : '2024'}</p>
            </PremiumCard>

            <PremiumCard glowColor={isPro ? "from-emerald-500/10" : "from-indigo-500/10"}>
                <div className="flex justify-between items-center mb-8">
                    <div className={`p-4 rounded-2xl ${isPro ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {isPro ? <Star size={24} /> : <Zap size={24} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border ${isPro ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                        Cérebro {plan.toUpperCase()}
                    </span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3">Nível de Processamento</h3>
                <p className="text-xs text-gray-500 mb-8 leading-relaxed font-medium uppercase">
                    {isPro 
                        ? "Potencial cognitivo máximo ativado. IA operando em 100% da capacidade."
                        : "Capacidade limitada. Sincronize com o plano PRO para auditoria fiscal e IA estratégica."}
                </p>
                <button type="button" disabled={portalLoading} onClick={handlePlanAction} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-60 ${isPro ? 'bg-white/5 text-gray-400 hover:text-white border border-white/5' : 'bg-white text-black hover:bg-gray-200'}`}>
                    {portalLoading ? 'Abrindo Stripe…' : isPro ? 'Configurar Plano' : 'Ativar Versão PRO'}
                </button>
            </PremiumCard>

            <div className="bg-[#09090b]/40 border border-white/[0.05] rounded-[2rem] overflow-hidden shadow-xl backdrop-blur-md">
                <p className="px-6 pt-6 pb-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Hardware & Segurança</p>
                <MenuOption icon={Lock} label="Blindar Senha" onClick={() => setIsPasswordModalOpen(true)} />
                <MenuOption icon={Bell} label="Fluxo de Alertas" value={pushNotif ? "Ativos" : "Mudos"} onClick={() => setIsNotificationsModalOpen(true)} />
                <MenuOption icon={LogOut} label="Terminar Sessão" color="text-rose-500" onClick={handleLogout} />
            </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:col-span-8">
            <PremiumCard>
                <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><User size={20} /></div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Perímetro do Perfil</h2>
                    </div>
                    {!isEditing && (
                        <button type="button" onClick={() => setIsEditing(true)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-6 py-2.5 rounded-xl border border-indigo-500/10 transition-all hover:bg-indigo-500/20">Modificar</button>
                    )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                            <input name="full_name" value={profile.full_name || ''} onChange={handleChange} required disabled={!isEditing} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-black focus:border-indigo-500/50 outline-none transition-all disabled:opacity-30" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Telefone de Segurança</label>
                            <input name="phone" value={profile.phone || ''} onChange={handleChange} disabled={!isEditing} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-mono focus:border-indigo-500/50 outline-none transition-all disabled:opacity-30" placeholder="(00) 00000-0000" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Target size={12} className="text-indigo-500"/> Diretriz Financeira Principal</label>
                        <textarea name="bio" value={profile.bio || ''} onChange={handleChange} disabled={!isEditing} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-medium focus:border-indigo-500/50 outline-none transition-all resize-none disabled:opacity-30" placeholder="Defina seu objetivo para a IA analisar..." />
                    </div>

                    <div className="pt-8 border-t border-white/5">
                         <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 italic">Arquitetura Cognitiva</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div 
                                onClick={() => setIaEnabled(!iaEnabled)}
                                className={`p-6 rounded-[1.5rem] border transition-all cursor-pointer ${iaEnabled ? 'border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/5 bg-white/5 opacity-50'}`}
                             >
                                 <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                         <BrainCircuit size={24} className={iaEnabled ? "text-indigo-400" : "text-gray-500"}/>
                                         <div>
                                             <p className={`text-xs font-black uppercase tracking-tight ${iaEnabled ? "text-white" : "text-gray-400"}`}>Motor Analítico</p>
                                             <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">Processamento de Dados</p>
                                         </div>
                                     </div>
                                     <div className={`w-10 h-5 rounded-full relative transition-colors ${iaEnabled ? 'bg-indigo-500' : 'bg-gray-600'}`}>
                                         <motion.div layout animate={{ x: iaEnabled ? 22 : 2 }} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>

                    <AnimatePresence>
                        {isEditing && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-8 flex flex-col md:flex-row justify-end gap-4">
                                <button type="button" onClick={() => setIsEditing(false)} className="bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Abortar</button>
                                <button type="submit" disabled={saving} className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95">
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Sincronizar Alterações
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </PremiumCard>

            <PremiumCard>
              <div className="mb-6 border-b border-white/5 pb-5">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Privacidade e Dados</h2>
                <p className="mt-2 text-xs text-gray-500">Baixe uma cópia ou exclua permanentemente sua conta.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={handleExport} disabled={exporting} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exportar meus dados
                </button>
                <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-xs font-black uppercase tracking-widest text-rose-400">
                  <Trash2 size={16} /> Excluir minha conta
                </button>
              </div>
            </PremiumCard>
        </div>
      </div>

      {/* MODAL DE SENHA */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white rounded-full transition-colors"><X size={20}/></button>
                <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Segurança Máxima</h3>
                <p className="text-xs text-gray-500 mb-8 font-medium">Atualize sua chave de acesso ao sistema.</p>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nova Senha</label><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-indigo-500/50" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirmar Senha</label><input type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-indigo-500/50" /></div>
                    <button type="submit" disabled={passLoading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-5 text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all flex justify-center items-center gap-3">
                        {passLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Sobrescrever Senha
                    </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
            <motion.div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-md rounded-[2rem] border border-rose-500/20 bg-[#09090b] p-8">
              <h3 id="delete-account-title" className="text-2xl font-black text-white">Excluir conta permanentemente</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">A assinatura será cancelada e seus dados e recibos serão removidos. Esta ação não pode ser desfeita.</p>
              <label className="mt-6 block text-[10px] font-black uppercase tracking-widest text-gray-500">Digite EXCLUIR para confirmar</label>
              <input aria-label="Confirmação de exclusão" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-rose-500" />
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmation('') }} className="flex-1 rounded-2xl bg-white/5 py-4 text-xs font-black uppercase tracking-widest text-white">Cancelar</button>
                <button type="button" onClick={handleDeleteAccount} disabled={deleting || deleteConfirmation !== 'EXCLUIR'} className="flex-1 rounded-2xl bg-rose-600 py-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-40">
                  {deleting ? 'Excluindo…' : 'Excluir definitivamente'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} /> 
    </div>
  )
}
