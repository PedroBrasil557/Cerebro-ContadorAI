// components/investments/InvestmentAdvisor.tsx
'use client'

import React, { useState } from 'react'
import { Goal, EmergencyFund } from '@/types_db'
import { Brain, ArrowRight, Loader2 } from 'lucide-react'
import CustomSelect from '../ui/CustomSelect'

type RiskProfile = 'Conservador' | 'Moderado' | 'Arrojado'

type AdvisorProps = {
  goals: Goal[]
  emergencyFund: EmergencyFund | null
  cdiRate: number
}

export default function InvestmentAdvisor({
  goals,
  emergencyFund,
  cdiRate,
}: AdvisorProps) {
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('Moderado')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const getInvestmentAdvice = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiResponse('')

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      setAiError(
        'Chave de API do Gemini não configurada. Verifique o arquivo .env.local.'
      )
      setAiLoading(false)
      return
    }

    const context = `
      **Contexto Financeiro:**
      - Reserva de Emergência: ${Number(emergencyFund?.current_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      - Metas: ${goals.length > 0 ? goals.map((g) => `- ${g.title}: ${Number(g.current_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de ${Number(g.target_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`).join('\n') : 'Nenhuma'}
      - Taxa CDI Atual: ${(cdiRate * 100).toFixed(2)}% a.a.
      - Perfil de Risco: ${riskProfile}
    `
    const systemPrompt = "Você é o 'Cérebro IA', um consultor financeiro sênior no Brasil. Use Markdown (listas, negrito) para formatar sua resposta. Seja profissional, encorajador e dê recomendações práticas (CDBs, Tesouro Selic, LCIs/LCAs) com base no perfil de risco e contexto do usuário."
    const userQuery = `Baseado no meu contexto e perfil ${riskProfile}, quais os próximos passos práticos? Onde focar aportes? Minha reserva é adequada? Fale sobre tipos de investimento e onde encontrar (ex: "CDBs 100% do CDI em bancos digitais").`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: context }, { text: userQuery }] }],
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Erro API Gemini: ${errorData.error?.message || 'Erro'}`)
      }

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      setAiResponse(text)
    } catch (error: any) {
      console.error('Erro ao chamar Gemini API:', error)
      setAiError('Falha ao comunicar com o consultor de IA. ' + error.message)
    } finally {
      setAiLoading(false)
    }
  }

  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="my-1">$1</li>')
      .replace(/^(?!<li)(.*)$/gm, (match, p1) =>
        p1.trim() === '' ? '<br>' : `<p class="my-2">${p1}</p>`
      )
      .replace(/<p class="my-2"><li/g, '<li')
      .replace(/<\/li><\/p>/g, '</li>')
  }

  return (
    <div className="rounded-lg border border-violet-300 bg-white p-4 shadow-lg dark:border-violet-700 dark:bg-gray-800">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-violet-700 dark:text-violet-300">
        <Brain className="h-6 w-6" />
        Consultor de Investimentos Cérebro IA
      </h3>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="riskProfile"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Meu Perfil de Risco:
          </label>
          <CustomSelect
            value={riskProfile}
            onChange={(val) => setRiskProfile(val as RiskProfile)}
            options={['Conservador', 'Moderado', 'Arrojado']}
          />
        </div>
        <button
          onClick={getInvestmentAdvice}
          disabled={aiLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400"
        >
          {aiLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
          {aiLoading ? 'Analisando...' : 'Pedir Análise'}
        </button>
      </div>

      <div className="mt-6">
        {aiLoading && (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              O Cérebro IA está pensando...
            </p>
          </div>
        )}
        {aiError && (
          <div className="rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            <strong>Erro:</strong> {aiError}
          </div>
        )}
        {aiResponse && (
          <div
            className="prose prose-sm prose-violet max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(aiResponse) }}
          />
        )}
      </div>
    </div>
  )
}