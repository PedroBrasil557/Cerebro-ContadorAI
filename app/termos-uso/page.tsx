'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans relative overflow-hidden flex flex-col items-center py-12 px-4 sm:px-6">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl mb-8 flex items-center justify-between z-10">
        <Link href="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
           <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft size={16} />
           </div>
           Voltar para Login
        </Link>
      </div>

      <div className="w-full max-w-4xl bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10">
        
        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-8">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <FileText className="text-indigo-500" size={24} />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Termos de Uso</h1>
                <p className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        </div>

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-400">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Aceitação</h2>
            <p>
              Ao acessar o <strong>Cérebro Financial OS</strong>, você concorda com estes termos. O sistema é fornecido "como está" para auxiliar na gestão financeira e de agendamentos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Responsabilidades do Usuário</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Você é responsável por manter a confidencialidade das suas credenciais de acesso (Login Google).</li>
              <li>Você concorda em fornecer informações verdadeiras e precisas ao utilizar o sistema.</li>
              <li>É proibido utilizar o sistema para fins ilícitos ou fraudulentos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Limitação de Responsabilidade</h2>
            <p>
              O Cérebro Financial OS é uma ferramenta de organização e produtividade. <strong>Não somos consultores financeiros.</strong> 
              Não nos responsabilizamos por perdas financeiras decorrentes de decisões tomadas com base nos dados organizados pelo sistema.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Modificações</h2>
            <p>
              Reservamo-nos o direito de modificar o sistema, funcionalidades ou estes termos a qualquer momento. O uso contínuo após as alterações implica na aceitação dos novos termos.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}