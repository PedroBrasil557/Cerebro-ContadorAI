'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, User, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName, 
          }
        }
      })

      if (error) throw error

      toast.success('Conta criada! Verifique seu email.')
      router.push('/login')
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-8 shadow-2xl relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><Sparkles className="text-blue-400" /></div>
          </div>
          <h1 className="text-2xl font-bold">Crie sua conta</h1>
          <p className="text-gray-400 text-sm mt-1">Comece a controlar suas finanças.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <User size={18} className="text-gray-400 mr-3" />
              <input required placeholder="Seu nome" className="bg-transparent w-full outline-none text-sm"
                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Email</label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <Mail size={18} className="text-gray-400 mr-3" />
              <input type="email" required placeholder="seu@email.com" className="bg-transparent w-full outline-none text-sm"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Senha</label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <Lock size={18} className="text-gray-400 mr-3" />
              <input type="password" required placeholder="••••••••" className="bg-transparent w-full outline-none text-sm"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all active:scale-95">
            {isLoading ? <Loader2 className="animate-spin" /> : 'Criar Conta'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 relative z-10">
          Já tem conta? <Link href="/login" className="text-blue-400 font-bold hover:underline">Faça Login</Link>
        </div>
      </motion.div>
    </div>
  )
}