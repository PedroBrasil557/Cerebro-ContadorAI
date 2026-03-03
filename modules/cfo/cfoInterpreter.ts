import { BusinessMetrics } from './cfoEngine';
import { cfoRulesEngine, CfoAlert } from './cfoRulesEngine';
import { formatCurrency } from '@/lib/utils'; // Assumindo que você tem um formatador

export const cfoInterpreter = {
  
  /**
   * Gera o prompt estruturado e rigoroso para enviar à API do LLM (GPT/Gemini)
   */
  generatePrompt: (metrics: BusinessMetrics): string => {
    // 1. Calcula a saúde e os alertas via regras determinísticas
    const { score, alerts } = cfoRulesEngine.evaluateHealth(metrics);
    const safeDraw = cfoRulesEngine.calculateSafeDraw(metrics);

    // 2. Filtra alertas críticos para dar foco
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'medium');

    // 3. Constrói o contexto blindado
    const prompt = `
Você é o CFO Virtual (Diretor Financeiro) do "Cérebro.OS", um sistema enterprise de gestão.
Sua função é analisar os dados financeiros da empresa (um estúdio de Nail Design) e fornecer um relatório estratégico, direto e acionável para o dono (Pedro).

DADOS FINANCEIROS REAIS DA EMPRESA (NÃO INVENTE NÚMEROS):
- Faturamento do Mês: ${formatCurrency(metrics.revenue)}
- Despesas Operacionais: ${formatCurrency(metrics.expenses)}
- Caixa Atual (Reserva): ${formatCurrency(metrics.cashReserve)}
- Business Score: ${score}/100

SITUAÇÃO ATUAL IDENTIFICADA PELO SISTEMA:
${criticalAlerts.length > 0 ? `[CRÍTICO] AMEAÇAS IMINENTES:\n${criticalAlerts.map(a => `- ${a.message}`).join('\n')}` : '[SAUDÁVEL] Nenhuma ameaça crítica de curto prazo.'}
${warningAlerts.length > 0 ? `\n[ATENÇÃO] PONTOS DE MELHORIA:\n${warningAlerts.map(a => `- ${a.message}`).join('\n')}` : ''}

DIRETRIZ DE PRÓ-LABORE (SALÁRIO DO DONO):
O sistema calculou que o saque máximo seguro para o dono neste mês é de ${formatCurrency(safeDraw)}.

INSTRUÇÕES DE RESPOSTA:
1. Comece com um Resumo Executivo (1 parágrafo) do status da empresa com base no Business Score de ${score}/100.
2. Analise a saúde do caixa e o teto do Pró-labore (${formatCurrency(safeDraw)}).
3. Se houver alertas críticos, forneça um Plano de Ação Imediato de 3 passos.
4. Mantenha um tom profissional, firme e encorajador.
5. Formate a resposta usando Markdown para facilitar a leitura.
`;

    return prompt;
  }
};