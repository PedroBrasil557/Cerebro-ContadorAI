'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Sparkles, Lock, ShieldCheck, Mail, LogIn, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Ícone Oficial do Google
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true) // Controla se é Login ou Cadastro
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })
  
  const supabase = createClient()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // --- LÓGICA DE LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        toast.success('Bem-vindo de volta!')
        router.push('/')
      } else {
        // --- LÓGICA DE CADASTRO ---
        // Aqui enviamos o 'full_name' nos metadados para o Trigger SQL criar o perfil automaticamente
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              avatar_url: ''
            }
          }
        })
        if (error) throw error
        toast.success('Conta criada com sucesso! Você já pode entrar.')
        
        // Se o Supabase não exigir confirmação de email, redireciona direto:
        router.push('/') 
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na autenticação')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { 
          access_type: 'offline', 
          prompt: 'consent', // Força o Google a pedir permissão da agenda novamente
          scope: 'openid profile email https://www.googleapis.com/auth/calendar' // Escopo da Agenda
        }
      }
    })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans text-white bg-[#050505] selection:bg-blue-500/30 selection:text-blue-100">
      
      {/* Background Atmosférico */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,#1e1e2e40,transparent)]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-[400px] px-6 z-10"
      >
        <div className="absolute -inset-[1px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-3xl blur-sm opacity-40"></div>

        <div className="relative bg-[#09090b]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center ring-1 ring-white/5">
          
          {/* Logo */}
          <div className="mb-6 relative group">
             <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"></div>
             <div className="relative bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 p-3 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-blue-400 fill-blue-400/10" />
             </div>
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {isLogin ? 'Acesse seu painel financeiro' : 'Comece a controlar seu império'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="w-full space-y-3">
            
            {/* Campo Nome (Só aparece no Cadastro) */}
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-all group mb-3">
                    <User size={16} className="text-gray-500 group-focus-within:text-blue-400 mr-3 transition-colors" />
                    <input 
                      required 
                      placeholder="Nome Completo" 
                      className="bg-transparent text-white w-full outline-none text-sm placeholder-gray-600"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-all group">
              <Mail size={16} className="text-gray-500 group-focus-within:text-blue-400 mr-3 transition-colors" />
              <input 
                type="email" 
                required 
                placeholder="seu@email.com" 
                className="bg-transparent text-white w-full outline-none text-sm placeholder-gray-600"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-all group">
              <Lock size={16} className="text-gray-500 group-focus-within:text-blue-400 mr-3 transition-colors" />
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                className="bg-transparent text-white w-full outline-none text-sm placeholder-gray-600"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-blue-900/20 mt-2"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4"/> : (
                <>
                  <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                  {isLogin ? <LogIn className="w-4 h-4 opacity-70" /> : <ArrowRight className="w-4 h-4 opacity-70" />}
                </>
              )}
            </button>
          </form>

          <div className="relative w-full flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative bg-[#09090b] px-3 text-[10px] uppercase font-bold text-gray-600 tracking-widest">Ou</div>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#f0f0f0] text-[#09090b] font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 text-gray-600"/> : (
              <>
                <GoogleIcon />
                <span className="text-sm font-bold">Google</span>
              </>
            )}
          </button>

          <div className="mt-6 pt-4 border-t border-white/5 w-full">
             <p className="text-xs text-gray-500">
               {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
               <button 
                 onClick={() => setIsLogin(!isLogin)} 
                 className="ml-1.5 text-blue-400 hover:text-blue-300 font-bold transition-colors hover:underline"
               >
                 {isLogin ? 'Cadastre-se' : 'Fazer Login'}
               </button>
             </p>
          </div>

        </div>
      </motion.div>
      
      <div className="absolute bottom-6 flex items-center gap-2 text-white/20 select-none">
         <ShieldCheck className="h-3 w-3" />
         <span className="text-[10px] font-semibold tracking-widest uppercase">Cérebro Financial OS / Google Gemini</span>
      </div>

    </div>
  )
}