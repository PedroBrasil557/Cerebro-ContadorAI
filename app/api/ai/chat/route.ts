// app/api/ai/chat/route.ts
import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    // =======================================================================
    // 1. BARREIRA DE SEGURANÇA (SaaS Protection Atualizada)
    // Usa o @supabase/ssr para entender cookies em base64 do Next.js 15+
    // =======================================================================
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Em rotas POST de API, nós apenas lemos a sessão.
            // Ignoramos o setAll para não dar conflito de headers enviados.
          },
        },
      }
    )

    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Acesso negado. Autenticação obrigatória." }, { status: 401 })
    }

    // =======================================================================
    // 2. PARSE DA REQUISIÇÃO
    // =======================================================================
    const { message, context } = await req.json()
    
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API Key não configurada no servidor." }, { status: 500 })
    }

    const groq = new Groq({ apiKey });

    // =======================================================================
    // 3. ROTEAMENTO DE INTELIGÊNCIA (Assistente vs CFO)
    // =======================================================================
    let systemContent = "";
    let temperatureConfig = 0.5;

    if (context) {
      const transactions = Array.isArray(context.transactions) ? context.transactions.slice(0, 30) : []
      const debts = Array.isArray(context.debts) ? context.debts : []
      const goals = Array.isArray(context.goals) ? context.goals : []
      const currentBalance = context.balance?.currentBalance || 0
      const monthlyGoal = context.balance?.monthlyGoal || 0
      const specificContext = context.context || ""

      systemContent = `
        Você é o Cérebro Financial AI, o assistente pessoal financeiro do usuário.
        
        DADOS REAIS DO USUÁRIO:
        - Saldo Atual: R$ ${currentBalance}
        - Meta Mensal: R$ ${monthlyGoal}
        ${specificContext ? `📌 INFORMAÇÃO ESPECÍFICA:\n${specificContext}\n` : ''}
        
        💸 ÚLTIMAS TRANSAÇÕES:\n${JSON.stringify(transactions, null, 2)} 
        ⚠️ DÍVIDAS ATIVAS:\n${JSON.stringify(debts, null, 2)}
        🎯 METAS FINANCEIRAS:\n${JSON.stringify(goals, null, 2)}

        DIRETRIZES: Seja conciso, direto e educado. Use emojis. Baseie-se APENAS nestes dados. Responda em PT-BR usando Markdown.
      `;
      temperatureConfig = 0.5; 
    } else {
      systemContent = `
        Você é o motor analítico do CFO Virtual do sistema Cérebro.OS.
        DIRETRIZES: 
        1. Responda com um tom executivo, analítico e de alto nível.
        2. Não use emojis em excesso, mantenha a seriedade de uma diretoria.
        3. Formate a resposta usando Markdown (H3, bullet points) para facilitar a leitura no dashboard.
        4. Foque estritamente nos dados que o usuário enviou na mensagem.
      `;
      temperatureConfig = 0.2; 
    }

    // =======================================================================
    // 4. PROCESSAMENTO GROQ (Llama 3)
    // =======================================================================
    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemContent },
            { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: temperatureConfig,
        max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || "Desculpe, o Conselho Diretor (IA) não conseguiu processar sua requisição."

    return NextResponse.json({ response })

  } catch (error) {
    console.error("[GROQ_AI_ERROR]:", error)
    return NextResponse.json({ error: "Erro interno ao processar a inteligência artificial." }, { status: 500 })
  }
}