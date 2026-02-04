'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans relative overflow-hidden flex flex-col items-center py-12 px-4 sm:px-6">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Botão Voltar (caso o usuário queira voltar pro login) */}
      <div className="w-full max-w-4xl mb-8 flex items-center justify-between z-10">
        <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
           <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft size={16} />
           </div>
           Voltar para Login
        </Link>
      </div>

      {/* Texto Oficial */}
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
            <h2 className="text-lg font-semibold text-white mb-3">1. Dados Coletados</h2>
            <p>
              Para o funcionamento do <strong>Cérebro Financial OS</strong>, coletamos apenas os dados estritamente necessários através do Login Google:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nome Completo e E-mail (para identificação da conta).</li>
              <li>Foto de Perfil (para personalização da interface).</li>
              <li>Dados Financeiros (transações e metas inseridas manualmente por você).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Uso do Google Agenda</h2>
            <p>
              Solicitamos permissão de acesso ao seu Google Calendar com a finalidade exclusiva de:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Adicionar automaticamente os agendamentos feitos no sistema à sua agenda pessoal.</li>
              <li>Ler sua disponibilidade para evitar conflitos de horários.</li>
            </ul>
            <p className="mt-2 text-xs bg-blue-500/10 text-blue-300 p-2 rounded border border-blue-500/20">
               Não compartilhamos, vendemos ou utilizamos seus dados de agenda para publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados de forma criptografada em servidores seguros (Supabase). Utilizamos protocolos HTTPS para garantir a segurança na transmissão dos dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Exclusão de Dados</h2>
            <p>
              Você pode solicitar a exclusão completa da sua conta e de todos os dados associados a qualquer momento entrando em contato com nosso suporte ou através das configurações do perfil.
            </p>
          </section>

          <section>
             <h2 className="text-lg font-semibold text-white mb-3">5. Contato</h2>
            <p>Para dúvidas sobre privacidade: <span className="text-white">pbrasil470@gmail.com</span></p>
          </section>
        </div>
      </div>
    </div>
  )
}