'use client'

import { useState } from 'react'
import Link from 'next/link' 
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Lock, Mail, User, ArrowRight, BrainCircuit, ShieldCheck, ArrowLeft } from 'lucide-react'
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

type ViewState = 'login' | 'register' | 'forgot'

export default function AuthPage() {
  const [view, setView] = useState<ViewState>('login')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' })
  
  const supabase = createClient()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/nova-senha`,
        })
        if (error) throw error
        toast.success('Link de recuperação enviado! Verifique seu e-mail.')
        setView('login') 
      } 
      else if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
        toast.success('Acesso liberado. Bem-vindo de volta!')
        router.push('/') // 🔥 CORRIGIDO PARA A ROTA PRINCIPAL
      } 
      else if (view === 'register') {
        if (formData.fullName.trim().length < 2) {
          throw new Error('Informe seu nome completo.')
        }

        if (formData.password.length < 8) {
          throw new Error('A senha deve ter pelo menos 8 caracteres.')
        }

        const { data, error } = await supabase.auth.signUp({
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

        if (!data.session) {
          toast.success('Conta criada. Confirme seu e-mail antes de entrar.')
          setView('login')
          return
        }

        toast.success('Conta criada com sucesso!')
        router.push('/')
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro na autenticação. Verifique seus dados.')
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
          prompt: 'consent', 
          scope: 'openid profile email https://www.googleapis.com/auth/calendar'
        }
      }
    })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans text-white bg-[#050505] selection:bg-indigo-500/30 selection:text-indigo-100 p-4">
      
      {/* Background Atmosférico (Estilo Cérebro.OS) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]"></div>
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-[420px] z-10"
      >
        <div className="relative bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 flex flex-col items-center ring-1 ring-white/5 overflow-hidden">
          
          {/* Brilho interno sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>

          {/* Logo e Branding Dinâmico */}
          <div className="mb-8 relative z-10 text-center flex flex-col items-center">
             <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4">
                <BrainCircuit className="h-8 w-8 text-indigo-400" />
             </div>
             <h1 className="text-2xl font-black tracking-tight text-white mb-1">
               {view === 'login' ? 'Bem-vindo ao Cérebro.IA' : view === 'register' ? 'Criar Conta Mestre' : 'Recuperar Acesso'}
             </h1>
             <p className="text-xs text-gray-400 font-medium text-balance">
               {view === 'login' ? 'Acesse seu painel financeiro blindado.' : view === 'register' ? 'O motor de decisões do seu patrimônio.' : 'Enviaremos um link de segurança para redefinir sua senha.'}
             </p>
          </div>

          {/* Formulário Principal */}
          <form onSubmit={handleAuth} className="w-full space-y-4 relative z-10">
            
            {/* Campo Nome (Apenas Cadastro) */}
            <AnimatePresence initial={false}>
              {view === 'register' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pb-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                      <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input 
                              required={view === 'register'}
                              type="text"
                              placeholder="Como quer ser chamado?" 
                              className="w-full bg-[#13131a] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all text-sm placeholder-gray-600"
                              value={formData.fullName}
                              onChange={e => setFormData({...formData, fullName: e.target.value})}
                          />
                      </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campo E-mail (Sempre Visível) */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="email" 
                        required 
                        placeholder="seu@email.com" 
                        className="w-full bg-[#13131a] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all text-sm font-mono placeholder-gray-600"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
            </div>

            {/* Campo Senha (Oculto na Recuperação) */}
            <AnimatePresence initial={false}>
              {view !== 'forgot' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Senha de Segurança</label>
                          {view === 'login' && (
                              <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                Esqueceu?
                              </button>
                          )}
                      </div>
                      <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input 
                              type="password" 
                              required
                              minLength={view === 'register' ? 8 : undefined}
                              placeholder="••••••••" 
                              className="w-full bg-[#13131a] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:border-indigo-500/50 focus:bg-white/10 outline-none transition-all text-sm font-mono placeholder-gray-600"
                              value={formData.password}
                              onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                      </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black py-3.5 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4"/> : (
                <>
                  <span>
                    {view === 'login' ? 'Desbloquear Cofre' : view === 'register' ? 'Criar Conta Mestre' : 'Enviar Link de Recuperação'}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </>
              )}
            </button>
          </form>

          {/* Divisor e Botão do Google (Escondidos na Recuperação de Senha) */}
          <AnimatePresence>
            {view !== 'forgot' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full overflow-hidden">
                <div className="relative w-full flex items-center justify-center my-6 z-10">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative bg-[#09090b] px-4 text-[10px] uppercase font-bold text-gray-600 tracking-widest">Autenticação Segura</div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin} 
                  disabled={loading} 
                  className="relative z-10 w-full flex items-center justify-center gap-3 bg-[#13131a] border border-white/10 hover:bg-white/5 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4 text-gray-400"/> : (
                    <>
                      <GoogleIcon />
                      <span className="text-sm">Continuar com Google</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Login/Cadastro/Voltar */}
          <div className="mt-8 pt-6 border-t border-white/5 w-full flex flex-col items-center gap-4 relative z-10">
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                {view === 'forgot' ? (
                  <button type="button" onClick={() => setView('login')} className="flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    <ArrowLeft size={14} /> Voltar para o Login
                  </button>
                ) : (
                  <>
                    {view === 'login' ? 'Ainda não é um membro?' : 'Já possui acesso ao sistema?'}
                    <button 
                      type="button" 
                      onClick={() => { setView(view === 'login' ? 'register' : 'login'); setFormData({ fullName: '', email: '', password: '' }); }} 
                      className="font-bold text-white hover:text-indigo-400 transition-colors underline underline-offset-4 decoration-indigo-500/30"
                    >
                      {view === 'login' ? 'Cadastre-se agora' : 'Fazer Login'}
                    </button>
                  </>
                )}
              </div>

              {/* Links Legais */}
              <div className="flex items-center gap-3 text-[10px] text-gray-600 font-medium">
                 <Link href="/politica-privacidade" className="hover:text-indigo-400 transition-colors">Privacidade</Link>
                 <span className="h-1 w-1 rounded-full bg-gray-800"></span>
                 <Link href="/termos-uso" className="hover:text-indigo-400 transition-colors">Termos de Uso</Link>
              </div>
          </div>

        </div>
      </motion.div>
      
      {/* Badge de Segurança Fixo no Rodapé */}
      <div className="absolute bottom-6 flex items-center gap-2 text-white/20 select-none pointer-events-none">
         <ShieldCheck className="h-3 w-3" />
         <span className="text-[9px] font-bold tracking-widest uppercase font-mono">Ambiente Seguro & Criptografado</span>
      </div>

    </div>
  )
}
