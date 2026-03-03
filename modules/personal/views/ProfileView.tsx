'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, Globe, Lock, ShieldCheck, 
  Edit3, Camera, Upload, LogOut, Award, ChevronRight,
  Settings, Key, CreditCard, Bell
} from 'lucide-react'

// --- 1. COMPONENTES VISUAIS (Mantendo o Design Premium) ---

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

const Badge = ({ email }: { email: string }) => {
  // Lógica simples: Se tiver email, é membro. Futuramente pode vir do banco (ex: user.subscription_tier)
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400">
      <Award size={14} />
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Membro Ativo</span>
    </div>
  )
}

const MenuOption = ({ icon: Icon, label, value, color = "text-white", onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition active:bg-white/10 group first:rounded-t-2xl last:rounded-b-2xl border-b border-white/5 last:border-0"
    >
        <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-xl text-gray-400 group-hover:text-white transition-colors">
                <Icon size={20} />
            </div>
            <span className={`font-medium text-sm md:text-base ${color}`}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {value && <span className="text-xs text-gray-500 font-medium">{value}</span>}
            <ChevronRight size={16} className="text-gray-600" />
        </div>
    </button>
)

const InfoField = ({ label, value, icon: Icon, isEditable = false }: any) => (
  <div className="group relative">
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
      <div className="p-2 rounded-xl bg-white/5 text-gray-400 group-hover:text-white transition-colors">
        <Icon size={18} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm md:text-base text-white font-medium leading-relaxed truncate" title={value}>
            {value || 'Não informado'}
        </p>
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

  // Extração Segura dos Dados Reais do Supabase
  // O objeto 'user' pode vir do 'session.user' ou da tabela 'user_profiles'
  const realData = {
    fullName: user?.full_name || user?.user_metadata?.full_name || 'Usuário',
    email: user?.email || '',
    phone: user?.phone || user?.user_metadata?.phone || '',
    avatarUrl: user?.avatar_url || user?.user_metadata?.avatar_url,
    createdAt: user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Recentemente',
    location: user?.location || 'Brasil', // Se não tiver no banco, mantém um genérico ou vazio
    bio: user?.bio || 'Configurações da sua conta.'
  }

  // Inicial do nome para o avatar padrão
  const userInitial = realData.fullName ? realData.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-500">
      
      {/* 1. HEADER PERFIL */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          
          {/* Avatar Grande */}
          <div className="relative group">
             <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[3px] shadow-2xl shadow-blue-900/30">
                <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative">
                   {realData.avatarUrl ? (
                      <img src={realData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                      <span className="text-3xl md:text-4xl font-black text-white">{userInitial}</span>
                   )}
                   
                   {/* Overlay de Edição (Visual apenas por enquanto) */}
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                      <Camera className="text-white h-6 w-6 md:h-8 md:w-8" />
                   </div>
                </div>
             </div>
             <div className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg border-4 border-[#050505]">
                <Upload size={14} />
             </div>
          </div>

          {/* Infos Principais */}
          <div className="flex-1 text-center md:text-left">
             <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">{realData.fullName}</h1>
             <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-6 max-w-lg mx-auto md:mx-0">{realData.email}</p>
             
             <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full">
                <Badge email={realData.email} />
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-gray-400">
                   <span className="text-[10px] font-bold uppercase tracking-wider">Membro desde {realData.createdAt}</span>
                </div>
             </div>
          </div>

          {/* Botões de Ação (Desktop) */}
          <div className="hidden md:flex gap-3 self-start">
             <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/20 transition-all"
             >
                {isEditing ? 'Salvar Alterações' : 'Editar Perfil'}
             </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
         
         {/* 2. COLUNA ESQUERDA (Menu de Configurações) */}
         <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
            
            {/* Grupo: Conta */}
            <div className="bg-[#09090b] border border-white/10 rounded-3xl overflow-hidden">
                <p className="px-6 pt-6 pb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Geral</p>
                <MenuOption icon={User} label="Dados Pessoais" />
                <MenuOption icon={CreditCard} label="Assinatura" value="Basic" />
                <MenuOption icon={Bell} label="Notificações" value="On" />
            </div>

            {/* Grupo: Segurança */}
            <div className="bg-[#09090b] border border-white/10 rounded-3xl overflow-hidden">
                <p className="px-6 pt-6 pb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Segurança</p>
                <MenuOption icon={Lock} label="Alterar Senha" />
                <MenuOption icon={ShieldCheck} label="Privacidade" />
                <MenuOption icon={Settings} label="Preferências do App" />
            </div>

            {/* Logout */}
            <button className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-center gap-2 text-rose-500 font-bold transition">
                <LogOut size={18} /> Sair da Conta
            </button>
            
            <p className="text-center text-[10px] text-gray-600 uppercase pt-2">ID: {user?.id?.slice(0, 8) || '...'}</p>
         </div>

         {/* 3. COLUNA DIREITA (Detalhes Reais) */}
         <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
            
            {/* Grid de Informações */}
            <GlassCard className="p-6 md:p-8">
               <div className="flex items-center gap-2 mb-6 md:mb-8">
                  <User className="text-blue-400" size={20} />
                  <h3 className="text-lg font-bold text-white">Dados da Conta</h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <InfoField label="Nome Completo" value={realData.fullName} icon={User} isEditable />
                  <InfoField label="Email Principal" value={realData.email} icon={Mail} />
                  <InfoField label="Telefone" value={realData.phone} icon={Phone} isEditable />
                  <InfoField label="Localização" value={realData.location} icon={MapPin} isEditable />
               </div>

               {/* Botão Salvar Mobile */}
               {isEditing && (
                   <button 
                      onClick={() => setIsEditing(false)}
                      className="md:hidden w-full mt-6 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg"
                   >
                      Salvar Alterações
                   </button>
               )}
               {!isEditing && (
                   <button 
                      onClick={() => setIsEditing(true)}
                      className="md:hidden w-full mt-6 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl"
                   >
                      Editar Dados
                   </button>
               )}
            </GlassCard>

            {/* Banner de Status */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/20 p-6 rounded-3xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 shrink-0">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h4 className="text-base font-bold text-white">Conta Verificada</h4>
                    <p className="text-sm text-emerald-100/70">Seus dados estão sincronizados e seguros.</p>
                </div>
            </div>

         </div>
      </div>
    </div>
  )
}