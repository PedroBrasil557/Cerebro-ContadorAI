'use client'

import React, { useState } from 'react'
import { User, Camera, Mail, Phone, MapPin, Lock, Save, Edit2 } from 'lucide-react'

export default function ProfileView({ user }: any) {
  // Estado para controlar se está editando ou visualizando
  const [isEditing, setIsEditing] = useState(false)
  
  // Estados dos campos (Iniciando com dados do usuário ou vazios)
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || 'Pedro Brasil',
    email: user?.email || 'pedro@exemplo.com',
    phone: user?.phone || '(47) 99999-9999',
    location: 'Blumenau, SC',
    bio: 'Estudante de Sistemas na FURB e investidor apaixonado por tecnologia.'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    // Aqui entraria a lógica de salvar no Supabase
    console.log('Dados salvos:', formData)
    setIsEditing(false)
  }

  return (
    <div className="p-6 md:p-10 animate-in fade-in max-w-5xl mx-auto">
       <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Meu Perfil</h2>
            <p className="text-gray-400">Gerencie suas informações pessoais e segurança.</p>
          </div>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition ${
                isEditing 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {isEditing ? <><Save className="h-4 w-4"/> Salvar Alterações</> : <><Edit2 className="h-4 w-4"/> Editar Perfil</>}
          </button>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUNA DA ESQUERDA: FOTO E RESUMO */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center">
                 <div className="relative group cursor-pointer mb-4">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center border-4 border-[#151515] shadow-2xl overflow-hidden">
                       {user?.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                       ) : (
                          <span className="text-4xl font-bold text-white">PB</span>
                       )}
                    </div>
                    {/* Overlay de Câmera (só aparece se estiver editando ou hover) */}
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                       <Camera className="h-8 w-8 text-white" />
                    </div>
                 </div>
                 
                 <h3 className="text-xl font-bold text-white">{formData.fullName}</h3>
                 <p className="text-sm text-violet-400 font-medium mb-4">Membro PRO</p>
                 <p className="text-xs text-gray-500">Membro desde Out/2023</p>
              </div>

              {/* Status da Conta */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
                 <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Segurança</h4>
                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-emerald-500" />
                        <span className="text-sm text-white">Senha</span>
                    </div>
                    <button className="text-xs text-violet-400 hover:text-white font-bold">Alterar</button>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-white">2FA Ativo</span>
                    </div>
                 </div>
              </div>
          </div>

          {/* COLUNA DA DIREITA: FORMULÁRIO */}
          <div className="lg:col-span-2">
             <div className="bg-[#111] border border-white/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">Informações Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                         <User className="h-3 w-3" /> Nome Completo
                      </label>
                      <input 
                        name="fullName"
                        disabled={!isEditing}
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`w-full bg-black/40 border rounded-xl p-3 text-white outline-none transition
                            ${isEditing ? 'border-violet-500/50 focus:border-violet-500' : 'border-white/5 text-gray-400 cursor-not-allowed'}`}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                         <Phone className="h-3 w-3" /> Telefone
                      </label>
                      <input 
                        name="phone"
                        disabled={!isEditing}
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full bg-black/40 border rounded-xl p-3 text-white outline-none transition
                            ${isEditing ? 'border-violet-500/50 focus:border-violet-500' : 'border-white/5 text-gray-400 cursor-not-allowed'}`}
                      />
                   </div>

                   <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                         <Mail className="h-3 w-3" /> Email Principal
                      </label>
                      <input 
                        name="email"
                        disabled={true} // Email geralmente não se muda fácil
                        value={formData.email}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-600">Para alterar seu e-mail, entre em contato com o suporte.</p>
                   </div>

                   <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                         <MapPin className="h-3 w-3" /> Localização
                      </label>
                      <input 
                        name="location"
                        disabled={!isEditing}
                        value={formData.location}
                        onChange={handleChange}
                        className={`w-full bg-black/40 border rounded-xl p-3 text-white outline-none transition
                            ${isEditing ? 'border-violet-500/50 focus:border-violet-500' : 'border-white/5 text-gray-400 cursor-not-allowed'}`}
                      />
                   </div>
                   
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                      <textarea 
                        name="bio"
                        disabled={!isEditing}
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className={`w-full bg-black/40 border rounded-xl p-3 text-white outline-none transition resize-none
                            ${isEditing ? 'border-violet-500/50 focus:border-violet-500' : 'border-white/5 text-gray-400 cursor-not-allowed'}`}
                      />
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}