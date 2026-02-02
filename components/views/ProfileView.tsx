'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, Globe, Lock, ShieldCheck, 
  Edit3, Camera, Upload, LogOut, Award, ChevronRight,
  Settings, Key, AlertCircle
} from 'lucide-react'

// --- 1. MOCKS E TIPAGEM ---

interface UserProfile {
  fullName: string
  email: string
  phone: string
  location: string
  bio: string
  plan: 'free' | 'pro' | 'enterprise'
  memberSince: string
  avatarUrl?: string
  twoFactorEnabled: boolean
}

// Simulando dados que viriam do Banco/Auth (Fallback)
const MOCK_USER: UserProfile = {
  fullName: 'Usuário',
  email: 'usuario@email.com',
  phone: '(00) 00000-0000',
  location: 'Brasil',
  bio: 'Bem-vindo ao Cérebro.AI. Complete seu perfil para aproveitar ao máximo.',
  plan: 'free',
  memberSince: 'Hoje',
  twoFactorEnabled: false
}

// --- 2. COMPONENTES UI (ATOMIC DESIGN) ---

const GlassCard = ({ children, className = "", onClick }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    transition={{ duration: 0.3 }}
    onClick={onClick}
    className={`relative bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl ${className}`}
  >
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
)

const Badge = ({ type }: { type: string }) => {
  const safeType = (type || 'free').toLowerCase()
  
  const config = {
    pro: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Award, label: 'Membro PRO' },
    free: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: User, label: 'Plano Grátis' },
    enterprise: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Globe, label: 'Enterprise' }
  }[safeType] || { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: User, label: 'Membro' }
  
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
      <Icon size={14} />
      <span className="text-xs font-bold uppercase tracking-wider">{config.label}</span>
    </div>
  )
}

const InfoField = ({ label, value, icon: Icon, isEditable = false }: any) => (
  <div className="group relative">
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
      <div className="p-2 rounded-xl bg-white/5 text-gray-400 group-hover:text-white transition-colors">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm text-white font-medium leading-relaxed truncate">{value || 'Não informado'}</p>
      </div>
      {isEditable && (
        <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-blue-400 transition-all">
          <Edit3 size={16} />
        </button>
      )}
    </div>
  </div>
)

// --- VIEW PRINCIPAL ---

export default function ProfileView({ user }: { user?: any }) {
  const [isEditing, setIsEditing] = useState(false)

  // LÓGICA DE SEGURANÇA (NORMALIZAÇÃO DOS DADOS)
  // Se o objeto 'user' vier incompleto, preenchemos com dados seguros ou do Mock
  const safeUser: UserProfile = {
    fullName: user?.fullName || user?.user_metadata?.full_name || user?.user_metadata?.name || MOCK_USER.fullName,
    email: user?.email || MOCK_USER.email,
    phone: user?.phone || user?.user_metadata?.phone || MOCK_USER.phone,
    location: user?.location || MOCK_USER.location,
    bio: user?.bio || MOCK_USER.bio,
    plan: user?.plan || 'pro', // Default para PRO para ficar bonito no layout
    memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', {month: 'short', year: 'numeric'}) : MOCK_USER.memberSince,
    avatarUrl: user?.avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
    twoFactorEnabled: user?.twoFactorEnabled || false
  }

  // Pega a inicial de forma segura
  const userInitial = safeUser.fullName && safeUser.fullName.length > 0 
    ? safeUser.fullName.charAt(0).toUpperCase() 
    : 'U';

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto pb-32">
      
      {/* 1. CABEÇALHO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Meu Perfil</h1>
            <p className="text-gray-400 font-light max-w-lg">
               Gerencie suas informações pessoais, segurança e preferências.
            </p>
         </div>
         <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl border border-white/10 transition-all">
               <Settings size={18} /> Preferências
            </button>
            <button 
               onClick={() => setIsEditing(!isEditing)}
               className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/20 transition-all"
            >
               {isEditing ? 'Salvar Alterações' : 'Editar Perfil'}
            </button>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         
         {/* 2. COLUNA ESQUERDA (Identidade & Segurança) */}
         <div className="lg:col-span-4 space-y-6">
            
            {/* Card de Identidade */}
            <GlassCard className="p-8 flex flex-col items-center text-center relative overflow-hidden">
               {/* Background Gradient Sutil */}
               <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
               
               <div className="relative group mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[3px] shadow-2xl shadow-blue-900/30">
                     <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative">
                        {safeUser.avatarUrl ? (
                           <img src={safeUser.avatarUrl} alt={safeUser.fullName} className="w-full h-full object-cover" />
                        ) : (
                           // AQUI ESTAVA O ERRO: Agora usamos a variável segura 'userInitial'
                           <span className="text-4xl font-black text-white">{userInitial}</span>
                        )}
                        {/* Overlay de Edição */}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                           <Camera className="text-white h-8 w-8" />
                        </div>
                     </div>
                  </div>
                  <div className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full text-white shadow-lg border-4 border-[#09090b]">
                     <Upload size={14} />
                  </div>
               </div>

               <h2 className="text-2xl font-bold text-white mb-2">{safeUser.fullName}</h2>
               <p className="text-sm text-gray-400 mb-6 truncate max-w-[250px]">{safeUser.email}</p>
               
               <div className="flex flex-wrap justify-center gap-3 w-full">
                  <Badge type={safeUser.plan} />
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-gray-400">
                     <span className="text-[10px] font-bold uppercase tracking-wider">Desde {safeUser.memberSince}</span>
                  </div>
               </div>
            </GlassCard>

            {/* Card de Segurança */}
            <GlassCard className="p-6">
               <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <ShieldCheck className="text-emerald-400" />
                  <div>
                     <h3 className="text-base font-bold text-white">Segurança</h3>
                     <p className="text-xs text-gray-500">Proteção da conta</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white transition-colors">
                           <Lock size={16} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white">Senha</p>
                           <p className="text-[10px] text-gray-500">********</p>
                        </div>
                     </div>
                     <button className="text-xs font-bold text-blue-400 hover:text-blue-300">Alterar</button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white transition-colors">
                           <Key size={16} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white">2FA Autenticação</p>
                           <p className={`text-[10px] flex items-center gap-1 ${safeUser.twoFactorEnabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                              {safeUser.twoFactorEnabled ? <><CheckCircle2 size={10} /> Ativo</> : 'Desativado'}
                           </p>
                        </div>
                     </div>
                     <div className={`w-8 h-5 rounded-full flex items-center px-1 ${safeUser.twoFactorEnabled ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                        <div className={`w-3 h-3 rounded-full shadow-sm ${safeUser.twoFactorEnabled ? 'bg-emerald-500 ml-auto' : 'bg-gray-500'}`} />
                     </div>
                  </div>
               </div>
            </GlassCard>

            {/* Zona de Perigo */}
            <button className="w-full p-4 rounded-2xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-400 flex items-center justify-center gap-2 text-sm font-bold transition-all group">
               <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/> Sair da Conta
            </button>
         </div>

         {/* 3. COLUNA DIREITA (Informações Pessoais) */}
         <div className="lg:col-span-8 space-y-6">
            
            {/* Banner de Bio */}
            <GlassCard className="p-8 relative overflow-hidden">
               <div className="flex items-start justify-between mb-6">
                  <div>
                     <h3 className="text-xl font-bold text-white mb-2">Sobre Mim</h3>
                     <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                        {safeUser.bio}
                     </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-full">
                     <Edit3 size={18} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
                  </div>
               </div>
               
               <div className="flex gap-2">
                  {['Investimentos', 'Tecnologia', 'SaaS', 'Design'].map(tag => (
                     <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                        {tag}
                     </span>
                  ))}
               </div>
            </GlassCard>

            {/* Grid de Informações Detalhadas */}
            <GlassCard className="p-8">
               <div className="flex items-center gap-2 mb-8">
                  <User className="text-blue-400" size={20} />
                  <h3 className="text-lg font-bold text-white">Dados Pessoais</h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField label="Nome Completo" value={safeUser.fullName} icon={User} isEditable />
                  <InfoField label="Telefone" value={safeUser.phone} icon={Phone} isEditable />
                  <InfoField label="Email Principal" value={safeUser.email} icon={Mail} isEditable />
                  <InfoField label="Localização" value={safeUser.location} icon={MapPin} isEditable />
               </div>

               {/* Seção de Endereço (Extra) */}
               <div className="mt-8 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-6">
                     <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Endereço de Faturamento</h4>
                     <button className="text-xs font-bold text-blue-400 hover:text-blue-300">Editar</button>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex items-center gap-4 hover:border-blue-500/30 transition-colors cursor-pointer group">
                     <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                        <MapPin size={20} />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-white">Endereço Principal</p>
                        <p className="text-xs text-gray-500">{safeUser.location}</p>
                     </div>
                     <ChevronRight className="ml-auto text-gray-600 group-hover:text-white transition-colors" size={18} />
                  </div>
               </div>
            </GlassCard>

            {/* Configurações de Notificação */}
            <GlassCard className="p-6 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                     <AlertCircle size={20} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-white">Alertas de Segurança</h4>
                     <p className="text-xs text-gray-500">Receba avisos sobre acessos suspeitos.</p>
                  </div>
               </div>
               <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
               </div>
            </GlassCard>

         </div>
      </div>
    </div>
  )
}

// Ícones adicionais necessários
import { CheckCircle2 } from 'lucide-react'