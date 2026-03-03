// app/api/ai/cfo-analysis/route.ts
import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(req: Request) {
  try {
    const { caixaData, recentTransactions } = await req.json()
    
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500 })
    }

    const groq = new Groq({ apiKey });

    // 1. Cálculos de Inteligência de Negócio
    // Pega média de despesas dos últimos lançamentos (ou usa um valor fixo se não tiver histórico suficiente)
    const expenses = recentTransactions
        .filter((t: any) => t.type !== 'receita')
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0)
    
    // Se não tiver despesas registradas, assume 50% da meta para não quebrar a conta
    const estimatedMonthlyBurn = expenses > 0 ? expenses : (caixaData.monthlyGoal * 0.6)
    
    // Runway: Quantos meses o dinheiro dura
    const runway = (caixaData.currentBalance / (estimatedMonthlyBurn || 1)).toFixed(1)

    const prompt = `
      Atue como um CFO (Diretor Financeiro) Sênior de uma empresa de tecnologia.
      
      DADOS DA EMPRESA:
      - Saldo em Caixa (Hoje): R$ ${caixaData.currentBalance}
      - Meta de Faturamento Mensal: R$ ${caixaData.monthlyGoal}
      - Taxa de Imposto Configurada: ${caixaData.taxRate}%
      - Reserva de Emergência Alvo: ${caixaData.reserveRate}%
      - Burn Rate (Gasto Estimado Recente): R$ ${estimatedMonthlyBurn.toFixed(2)}
      - Runway Estimado (Sobrevivência): ${runway} meses
      
      TAREFA:
      Faça uma análise executiva da saúde financeira.
      
      FORMATO DE RESPOSTA (Markdown):
      ### 🏥 Diagnóstico de Saúde (Nota 0-100)
      (Dê uma nota baseada no Runway e na proximidade da meta. Seja rigoroso).

      ### 📉 Runway & Sobrevivência
      (Comente sobre o Runway de ${runway} meses. Isso é perigoso (<3 meses), ok (6 meses) ou excelente (>12 meses)?).

      ### 🚀 Próximos Passos
      (3 bullet points táticos: Devemos cortar custos? É hora de investir em tráfego pago? Aumentar a reserva?).

      ### 💡 Insight do CFO
      (Uma frase de efeito sobre a gestão atual).

      Seja profissional, direto e use emojis de negócios (barchart, rocket, warning).
    `

    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
    });

    const analysis = completion.choices[0]?.message?.content || "Erro ao gerar análise."

    return NextResponse.json({ analysis })

  } catch (error) {
    console.error("Erro CFO AI:", error)
    return NextResponse.json({ error: "Falha na análise" }, { status: 500 })
  }
}