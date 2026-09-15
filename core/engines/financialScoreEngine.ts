/**
 * core/engines/financialScoreEngine.ts
 * Motor de cálculo de saúde financeira do Cérebro.OS
 */

export interface FinancialScoreInput {
    monthlyIncome: number;
    monthlySavedAmount: number;
    monthlyDebtPayments: number;
    emergencyFundBalance: number;
    monthlyFixedExpenses: number;
    isCashflowPositive: boolean;
}

export interface ScoreResult {
    score: number;
    savingsScore: number;
    emergencyScore: number;
    debtScore: number;
    cashflowScore: number;
    healthStatus: 'Crítico' | 'Atenção' | 'Estável' | 'Excelente';
}

export function calculatePersonalFinancialScore(data: FinancialScoreInput): ScoreResult {
    // Pesos da nota (Soma = 1.0)
    const WEIGHTS = { 
        savings: 0.30, 
        emergency: 0.30, 
        debt: 0.25, 
        cashflow: 0.15 
    };
    
    // Trava de segurança: Se a renda for zero, tratamos como 1 para evitar erro matemático de divisão por zero
    const nonNegativeFinite = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
    const safeIncome = nonNegativeFinite(data.monthlyIncome);
    const safeSavedAmount = nonNegativeFinite(data.monthlySavedAmount);
    const safeDebtPayments = nonNegativeFinite(data.monthlyDebtPayments);
    const safeEmergencyFund = nonNegativeFinite(data.emergencyFundBalance);
    const safeFixedExpenses = nonNegativeFinite(data.monthlyFixedExpenses);

    // 1. Nota de Poupança (Ideal: poupar 20% ou mais da renda)
    // Se não tem renda, a nota de poupança é 0 por padrão.
    const savingsPct = safeIncome > 0 ? (safeSavedAmount / safeIncome) * 100 : 0;
    const savingsScore = Math.min(Math.max((savingsPct / 20) * 100, 0), 100);

    // 2. Nota de Emergência (Ideal: cobrir 6 meses de despesas fixas)
    const monthsCovered = safeFixedExpenses > 0 ? safeEmergencyFund / safeFixedExpenses : 0;
    const emergencyScore = safeFixedExpenses === 0 && safeEmergencyFund > 0
        ? 100
        : Math.min(Math.max((monthsCovered / 6) * 100, 0), 100);

    // 3. Nota de Endividamento (Ideal: comprometer menos de 30% da renda)
    // Se não tem renda mas tem dívida, o score cai para zero.
    let debtScore = 0;
    if (safeIncome > 0) {
        const debtRatio = (safeDebtPayments / safeIncome) * 100;
        debtScore = Math.max(100 - ((debtRatio / 30) * 100), 0);
    } else {
        // Se não tem renda e tem dívida, nota 0. Se não tem renda e nem dívida, nota 100.
        debtScore = safeDebtPayments > 0 ? 0 : 100;
    }

    // 4. Nota de Fluxo de Caixa (Fidelidade ao dado booleano)
    const cashflowScore = data.isCashflowPositive ? 100 : 0;

    // Cálculo Final Ponderado
    const finalScore = Math.round(
        (savingsScore * WEIGHTS.savings) +
        (emergencyScore * WEIGHTS.emergency) +
        (debtScore * WEIGHTS.debt) +
        (cashflowScore * WEIGHTS.cashflow)
    );

    // Classificação de Status baseada na nota final
    let healthStatus: ScoreResult['healthStatus'] = 'Excelente';
    if (finalScore < 40) healthStatus = 'Crítico';
    else if (finalScore < 60) healthStatus = 'Atenção';
    else if (finalScore < 80) healthStatus = 'Estável';

    return {
        score: isNaN(finalScore) ? 0 : finalScore,
        savingsScore: isNaN(savingsScore) ? 0 : Math.round(savingsScore),
        emergencyScore: isNaN(emergencyScore) ? 0 : Math.round(emergencyScore),
        debtScore: isNaN(debtScore) ? 0 : Math.round(debtScore),
        cashflowScore: Math.round(cashflowScore),
        healthStatus
    };
}
