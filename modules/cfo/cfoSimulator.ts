import { BusinessMetrics, cfoEngine } from './cfoEngine';
import { cfoRulesEngine } from './cfoRulesEngine';

export interface SimulationParams {
  revenueIncrease?: number; // Valor financeiro extra (+ R$ 1000)
  expenseIncrease?: number; // Aumento de custos (+ R$ 500)
  cashInjection?: number;   // Aporte no caixa (+ R$ 2000)
}

export const cfoSimulator = {
  
  runSimulation: (currentMetrics: BusinessMetrics, params: SimulationParams) => {
    // Cria o cenário futuro somando os parâmetros
    const projectedMetrics: BusinessMetrics = {
      ...currentMetrics,
      revenue: currentMetrics.revenue + (params.revenueIncrease || 0),
      expenses: currentMetrics.expenses + (params.expenseIncrease || 0),
      cashReserve: currentMetrics.cashReserve + (params.cashInjection || 0),
    };

    // Recalcula todas as métricas com o cenário projetado
    const projectedRunway = cfoEngine.calculateRunway(projectedMetrics.cashReserve, projectedMetrics.expenses);
    const projectedMargin = cfoEngine.calculateNetMargin(projectedMetrics.revenue, projectedMetrics.expenses, projectedMetrics.taxRate);
    const projectedHealth = cfoRulesEngine.evaluateHealth(projectedMetrics);
    
    // Retorna o impacto (diferença entre o atual e o futuro)
    const currentScore = cfoRulesEngine.evaluateHealth(currentMetrics).score;
    const scoreImpact = projectedHealth.score - currentScore;

    return {
      projectedMetrics,
      projectedRunway,
      projectedMargin,
      projectedScore: projectedHealth.score,
      scoreImpact,
      projectedAlerts: projectedHealth.alerts
    };
  }
};