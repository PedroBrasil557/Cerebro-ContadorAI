import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { BRAND } from '@/lib/branding'

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-12 text-gray-300 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white"><ArrowLeft size={16} /> Voltar para o login</Link>
        <article className="rounded-3xl border border-white/10 bg-[#0f0f0f]/80 p-8 shadow-2xl md:p-12">
          <header className="mb-8 flex items-center gap-4 border-b border-white/5 pb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10"><FileText className="text-indigo-500" /></div>
            <div><h1 className="text-3xl font-bold text-white">Termos de Uso</h1><p className="text-sm text-gray-500">Última atualização: 08/09/2026</p></div>
          </header>
          <div className="space-y-8 leading-relaxed text-gray-400">
            <section><h2 className="mb-3 text-lg font-semibold text-white">1. Aceitação e finalidade</h2><p>Ao usar o {BRAND.name}, você aceita estes termos. O serviço é uma ferramenta de organização e educação financeira; não substitui aconselhamento contábil, jurídico, tributário ou de investimentos.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">2. Inteligência artificial e OCR</h2><p>Análises de IA e leituras de recibos podem conter erros. Você deve revisar valores, datas e recomendações antes de tomar decisões ou registrar informações.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">3. Conta e uso aceitável</h2><p>Você deve manter suas credenciais seguras, fornecer dados legítimos e não tentar contornar autenticação, cotas, cobrança ou proteções do serviço. Uso abusivo, fraudulento ou ilegal pode resultar em suspensão.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">4. Planos, limites e assinatura</h2><p>Planos definem acesso e limites de IA, OCR, cartões e metas. Assinaturas são processadas pelo Stripe. Você pode gerenciar ou cancelar uma assinatura paga pelo Portal do Cliente; o acesso pago permanece sujeito ao estado informado pelo Stripe.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">5. Disponibilidade</h2><p>Podem ocorrer indisponibilidades por manutenção ou falhas de fornecedores. Não garantimos operação ininterrupta e podemos ajustar funcionalidades para segurança, conformidade ou evolução do produto.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">6. Responsabilidade</h2><p>Você é responsável por revisar os dados e pelas decisões tomadas. Na extensão permitida por lei, não respondemos por perdas indiretas decorrentes de dados incorretos inseridos pelo usuário, resultados de IA ou indisponibilidade temporária.</p></section>
            <section><h2 className="mb-3 text-lg font-semibold text-white">7. Encerramento e alterações</h2><p>Você pode exportar e excluir sua conta nas configurações. Estes termos podem ser atualizados; a data acima identifica a versão vigente.</p></section>
          </div>
        </article>
      </div>
    </main>
  )
}
