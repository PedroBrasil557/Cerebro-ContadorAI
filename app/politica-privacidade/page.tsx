'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans relative overflow-hidden flex flex-col items-center py-12 px-4 sm:px-6">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header com Botão Voltar */}
      <div className="w-full max-w-4xl mb-8 flex items-center justify-between z-10">
        <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
           <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft size={16} />
           </div>
           Voltar para Login
        </Link>
      </div>

      {/* Card de Conteúdo */}
      <div className="w-full max-w-4xl bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10">
        
        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-8">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="text-blue-500" size={24} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Política de Privacidade</h1>
                <p className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-400">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> 1. Introdução
            </h2>
            <p>
              O <strong>Cérebro Financial OS</strong> ("nós", "nosso") respeita a sua privacidade. 
              Esta política descreve como coletamos, usamos e protegemos suas informações ao usar nosso sistema.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> 2. Dados que Coletamos
            </h2>
            <ul className="list-disc pl-5 space-y-2 marker:text-blue-500/50">
              <li><strong>Informações da Conta Google:</strong> Ao fazer login com o Google, coletamos seu nome, endereço de e-mail e foto de perfil para criar sua conta.</li>
              <li><strong>Dados da Agenda (Google Calendar):</strong> Solicitamos acesso para visualizar e criar eventos em sua agenda apenas para funcionalidade de agendamento do sistema.</li>
              <li><strong>Dados Financeiros:</strong> Armazenamos as transações, metas e saldos que você insere manualmente no sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> 3. Como Usamos seus Dados
            </h2>
            <p className="mb-2">Utilizamos seus dados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-blue-500/50">
              <li>Fornecer o serviço de gestão financeira e agendamento.</li>
              <li>Sincronizar seus compromissos com o Google Agenda.</li>
              <li>Melhorar a experiência do usuário e segurança do sistema.</li>
            </ul>
            <p className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-blue-200/80 text-xs">
                <strong>Nota:</strong> Não vendemos seus dados para terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> 4. Segurança
            </h2>
            <p>
              Seus dados são armazenados de forma segura utilizando serviços de nuvem confiáveis (Supabase) e protegidos por criptografia padrão da indústria.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> 5. Contato
            </h2>
            <p>
              Para dúvidas sobre esta política, entre em contato através do e-mail: <span className="text-white">pbrasil470@gmail.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}