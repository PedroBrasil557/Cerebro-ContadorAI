import { cfoEngine, BusinessMetrics } from './cfoEngine';

export type AlertSeverity = 'low' | 'medium' | 'critical' | 'success';

export interface CfoAlert {
  id: string;
  metric: string;
  severity: AlertSeverity;
  message: string;
  value: number;
}

export const cfoRulesEngine = {
  
  evaluateHealth: (metrics: BusinessMetrics): { score: number; alerts: CfoAlert[] } => {
    const alerts: CfoAlert[] = [];
    const score = cfoEngine.calculateBusinessScore(metrics);
    
    const netMargin = cfoEngine.calculateNetMargin(metrics.revenue, metrics.expenses, metrics.taxRate);
    const runway = cfoEngine.calculateRunway(metrics.cashReserve, metrics.expenses);
    const taxReserve = cfoEngine.calculateTaxReserve(metrics.revenue, metrics.taxRate);

    // --- MARGEM LÍQUIDA ---
    if (netMargin < 0) {
      alerts.push({ id: 'margin_1', metric: 'Margem Líquida', severity: 'critical', message: 'Operação em prejuízo.', value: netMargin });
    } else if (netMargin < 15) {
      alerts.push({ id: 'margin_2', metric: 'Margem Líquida', severity: 'medium', message: 'Margem de lucro perigosa.', value: netMargin });
    } else if (netMargin >= 30) {
      alerts.push({ id: 'margin_3', metric: 'Margem Líquida', severity: 'success', message: 'Margem de lucro excelente.', value: netMargin });
    }

    // --- RUNWAY ---
    if (runway < 1) {
      alerts.push({ id: 'runway_1', metric: 'Runway', severity: 'critical', message: 'Caixa cobre menos de 1 mês.', value: runway });
    } else if (runway < 3) {
      alerts.push({ id: 'runway_2', metric: 'Runway', severity: 'medium', message: 'Fôlego financeiro curto.', value: runway });
    } else if (runway >= 6) {
      alerts.push({ id: 'runway_3', metric: 'Runway', severity: 'success', message: 'Caixa com mais de 6 meses de segurança.', value: runway });
    }

    // --- IMPOSTOS ---
    if (metrics.cashReserve < taxReserve) {
      alerts.push({ id: 'tax_1', metric: 'Impostos', severity: 'critical', message: 'Caixa não cobre impostos provisionados.', value: taxReserve });
    }

    return { score, alerts };
  },

  calculateSafeDraw: (metrics: BusinessMetrics): number => {
    const taxReserve = cfoEngine.calculateTaxReserve(metrics.revenue, metrics.taxRate);
    const netProfit = metrics.revenue - metrics.expenses - taxReserve;
    const runway = cfoEngine.calculateRunway(metrics.cashReserve, metrics.expenses);

    if (netProfit <= 0 || runway < 1.5) return 0;

    const drawPercentage = runway >= 4 ? 0.7 : 0.4;
    return netProfit * drawPercentage;
  }
};