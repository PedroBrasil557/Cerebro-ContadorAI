export interface BusinessMetrics {
  revenue: number;
  expenses: number;
  cashReserve: number;
  taxRate: number;
  activeClients: number;
  totalHoursWorked: number;
}

export const cfoEngine = {
  // 1. Margem Bruta
  calculateGrossMargin: (revenue: number, cogs: number): number => {
    if (revenue <= 0) return 0;
    return ((revenue - cogs) / revenue) * 100;
  },

  // 2. Margem Líquida
  calculateNetMargin: (revenue: number, expenses: number, taxRate: number): number => {
    if (revenue <= 0) return 0;
    const taxAmount = revenue * (taxRate / 100);
    const netProfit = revenue - expenses - taxAmount;
    return (netProfit / revenue) * 100;
  },

  // 3. Reserva Tributária
  calculateTaxReserve: (revenue: number, taxRate: number): number => {
    return revenue * (taxRate / 100);
  },

  // 4. Fôlego Financeiro (Runway)
  calculateRunway: (cashReserve: number, monthlyBurn: number): number => {
    if (monthlyBurn <= 0) return 99; // Infinito
    return cashReserve / monthlyBurn;
  },

  // 5. Ponto de Equilíbrio (Break-Even)
  calculateBreakEven: (fixedCosts: number, grossMarginPercentage: number): number => {
    if (grossMarginPercentage <= 0) return 0;
    return fixedCosts / (grossMarginPercentage / 100);
  },

  // 6. Ticket Médio
  calculateRevenuePerClient: (revenue: number, activeClients: number): number => {
    if (activeClients <= 0) return 0;
    return revenue / activeClients;
  },

  // 7. Produtividade (Receita/Hora)
  calculateRevenuePerHour: (revenue: number, totalHoursWorked: number): number => {
    if (totalHoursWorked <= 0) return 0;
    return revenue / totalHoursWorked;
  },

  // 8. Business Score (Algoritmo Proprietário 0-100)
  calculateBusinessScore: (metrics: BusinessMetrics): number => {
    let score = 0;
    
    const netMargin = cfoEngine.calculateNetMargin(metrics.revenue, metrics.expenses, metrics.taxRate);
    const runway = cfoEngine.calculateRunway(metrics.cashReserve, metrics.expenses);

    // Regra 1: Margem (Max 40)
    if (netMargin >= 30) score += 40;
    else if (netMargin >= 15) score += 25;
    else if (netMargin > 0) score += 10;

    // Regra 2: Caixa (Max 40)
    if (runway >= 6) score += 40;
    else if (runway >= 3) score += 20;
    else if (runway >= 1) score += 5;

    // Regra 3: Eficiência (Max 20)
    if (metrics.revenue > metrics.expenses * 1.5) score += 20;
    else if (metrics.revenue > metrics.expenses) score += 10;

    return Math.min(Math.max(score, 0), 100); 
  }
};