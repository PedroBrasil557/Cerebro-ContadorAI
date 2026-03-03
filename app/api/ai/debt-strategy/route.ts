import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(req: Request) {
  try {
    // 1. Recebe os dados do Frontend
    const { debts, transactions } = await req.json()
    
    // 2. Verifica a Chave
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API Key da Groq não configurada" }, { status: 500 })
    }

    // 3. Inicializa a Groq
    const groq = new Groq({ apiKey });

    // 4. Prepara o contexto financeiro (Cálculos rápidos para ajudar a IA)
    const income = transactions
      .filter((t: any) => t.type === 'receita')
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0)
      
    const expenses = transactions
      .filter((t: any) => t.type !== 'receita')
      .reduce((acc: number, t: any) => acc + Number(t.amount), 0)

    const balance = income - Math.abs(expenses)
    const totalDebt = debts.reduce((acc: number, d: any) => acc + Number(d.remaining_amount), 0)

    // 5. O Prompt (Instruções para a IA)
    const prompt = `
      Atue como o Cérebro Financial AI, um especialista em quitação de dívidas.
      
      DADOS DO CLIENTE:
      - Renda Mensal: R$ ${income.toFixed(2)}
      - Despesas: R$ ${expenses.toFixed(2)}
      - Saldo Livre: R$ ${balance.toFixed(2)}
      - Total em Dívidas: R$ ${totalDebt.toFixed(2)}
      
      DÍVIDAS CADASTRADAS:
      ${debts.map((d: any) => `- ${d.name}: R$ ${d.remaining_amount} (Juros: ${d.interest_rate}%)`).join('\n')}
      
      TAREFA:
      Crie um plano estratégico curto e direto para quitar essas dívidas.
      
      RESPOSTA EM MARKDOWN (Siga esta estrutura):
      ### 📊 Diagnóstico
      (Uma frase sobre a situação atual).

      ### 🎯 A Estratégia
      (Qual dívida pagar primeiro e por quê? Use matemática).

      ### 💰 Plano de Ação
      (Quanto pagar por mês em cada uma).

      ### 💡 Dica de Ouro
      (Uma dica de negociação ou corte de gastos).

      Não use introduções longas. Vá direto ao ponto. Use emojis.
    `

    // 6. Chama a IA (MODELO ATUALIZADO)
    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        // MODELO CORRIGIDO:
        model: "llama-3.3-70b-versatile", 
        temperature: 0.3,
    });

    const strategy = completion.choices[0]?.message?.content || "Erro ao gerar texto."

    return NextResponse.json({ strategy })

  } catch (error) {
    console.error("Erro Groq:", error)
    return NextResponse.json({ error: "Falha na IA" }, { status: 500 })
  }
}