import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { BRAND } from '@/lib/branding'

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-12 text-gray-300 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white"><ArrowLeft size={16} /> Voltar para o login</Link>
        <article className="rounded-3xl border border-white/10 bg-[#0f0f0f]/80 p-8 shadow-2xl md:p-12">
          <header className="mb-8 flex items-center gap-4 border-b border-white/5 pb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10"><ShieldCheck className="text-blue-500" /></div>
            <div><h1 className="text-3xl font-bold text-white">Política de Privacidade</h1><p className="text-sm text-gray-500">Última atualização: 08/09/2026</p></div>
          </header>
          <div className="space-y-8 leading-relaxed text-gray-400">
            <section><h2 className="mb-3 text-lg font-semibold text-white">1. Dados tratados</h2><p>O {BRAND.name} trata dados de cadastro, perfil, transações, cartões (sem número completo), dívidas, metas, investimentos, agendamentos, configurações profissionais e recibos enviados pelo usuário.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">2. Finalidades e inteligência artificial</h2><p>Usamos os dados para autenticação, organização financeira, cálculos, limites do plano e recursos solicitados. Quando você usa IA, o contexto necessário é enviado à Groq. Imagens de recibos são processadas por OCR; resultados devem ser revisados.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">3. Fornecedores</h2><p>O Supabase hospeda autenticação, banco e recibos privados. O Stripe processa assinaturas e pagamentos; não armazenamos dados completos do cartão. Groq processa solicitações de IA. Cada fornecedor trata dados conforme seus próprios termos.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">4. Agenda</h2><p>A v1 gera e envia convites ICS por e-mail quando o SMTP está configurado. Ela não lê diretamente sua disponibilidade no Google Calendar.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">5. Segurança e retenção</h2><p>Aplicamos HTTPS, controle de acesso por usuário e armazenamento privado para recibos. Mantemos dados enquanto a conta estiver ativa ou pelo período necessário para obrigações legais e prevenção de fraude.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">6. Seus direitos</h2><p>Nas configurações, você pode exportar seus dados em JSON e solicitar a exclusão da conta. A exclusão cancela a assinatura e remove dados e recibos associados, ressalvadas retenções exigidas por lei.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">7. Contato</h2><p>Privacidade: <a className="text-white underline" href="mailto:pbrasil470@gmail.com">pbrasil470@gmail.com</a>.</p></section>
          </div>
        </article>
      </div>
    </main>
  )
}
