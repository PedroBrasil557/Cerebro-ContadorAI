'use client'

import React, { useState, useEffect } from 'react'
import { User, Phone, Camera, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ProfileViewProps {
  user: any
  onUpdateProfile?: (data: any) => Promise<void> | void
}

export default function ProfileView({ user, onUpdateProfile }: ProfileViewProps) {
  // 1. Estado inicial seguro
  const [form, setForm] = useState({
      full_name: '',
      phone: '',
      avatar_url: ''
  })

  // Estados de UX
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // 2. CORREÇÃO CRÍTICA: Sincronização quando o user chega (Async)
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || ''
      })
    }
  }, [user]) // Roda sempre que o objeto 'user' mudar/chegar

  // 3. Handler Blindado
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      // Validação de segurança
      if (!onUpdateProfile) {
          setFeedback({ type: 'error', message: 'Função de atualização indisponível.' })
          return
      }
      
      // Evita duplo clique
      if (isSaving) return

      setIsSaving(true)
      setFeedback(null)

      try {
          // Tenta executar a atualização
          await onUpdateProfile(form)
          
          // Sucesso
          setFeedback({ type: 'success', message: 'Alterações salvas com sucesso!' })
          
          // Limpa mensagem de sucesso após 3 segundos
          setTimeout(() => setFeedback(null), 3000)

      } catch (error) {
          console.error("Erro ao salvar perfil:", error)
          setFeedback({ type: 'error', message: 'Erro ao salvar. Tente novamente.' })
      } finally {
          setIsSaving(false)
      }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in space-y-8">
      <h2 className="text-3xl font-bold text-white mb-8">Meu Perfil</h2>
      
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
         <div className="flex items-center gap-6 mb-8">
            <div className="h-24 w-24 rounded-full bg-violet-600/20 flex items-center justify-center border-2 border-violet-500 relative overflow-hidden group">
               {form.avatar_url ? (
                   <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                   <User className="h-10 w-10 text-violet-400" />
               )}
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                   <Camera className="h-6 w-6 text-white" />
               </div>
            </div>
            <div>
               <h3 className="text-xl font-bold text-white">{user?.email || 'Carregando...'}</h3>
               <p className="text-violet-400 text-sm">Conta verificada</p>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                        <input 
                            type="text" 
                            value={form.full_name}
                            onChange={e => setForm({...form, full_name: e.target.value})}
                            disabled={isSaving}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 outline-none transition disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold">Telefone</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                        <input 
                            type="text" 
                            value={form.phone}
                            onChange={e => setForm({...form, phone: e.target.value})}
                            disabled={isSaving}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 outline-none transition disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold">Avatar URL (Link da Imagem)</label>
                    <div className="relative">
                        <Camera className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                        <input 
                            type="text" 
                            value={form.avatar_url}
                            onChange={e => setForm({...form, avatar_url: e.target.value})}
                            placeholder="https://..."
                            disabled={isSaving}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 outline-none transition disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            {/* Área de Feedback e Ação */}
            <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-end items-center gap-4">
                
                {/* Mensagens de Feedback */}
                {feedback && (
                    <div className={`flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-right-2 ${
                        feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                        {feedback.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {feedback.message}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-violet-900/20"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" /> Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" /> Salvar Alterações
                        </>
                    )}
                </button>
            </div>
         </form>
      </div>
    </div>
  )
}