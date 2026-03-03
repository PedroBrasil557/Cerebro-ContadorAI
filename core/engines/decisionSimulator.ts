export interface CurrentState {
    balance: number;
    monthlyIncome: number;
    monthlySavings: number;
    currentScore: number;
    emergencyFund: number;
}

export interface PurchaseIntent {
    value: number;
    type: 'a_vista' | 'parcelado';
    installments?: number;
    isEssential: boolean;
}

export interface SimulationResult {
    isApproved: boolean;
    newBalance: number;
    projectedScoreDrop: number;
    recoveryTimeMonths: number;
    aiAdvice: string;
}

export function simulatePurchaseImpact(current: CurrentState, purchase: PurchaseIntent): SimulationResult {
    let newBalance = current.balance;
    let projectedScoreDrop = 0;
    let recoveryTimeMonths = 0;
    let isApproved = true;
    let aiAdvice = "";

    if (purchase.type === 'a_vista') {
        newBalance -= purchase.value;
        if (newBalance < 0) {
            // Vai ter que usar reserva de emergência ou limite
            const debtCreated = Math.abs(newBalance);
            projectedScoreDrop = 15; // Penalidade dura
            recoveryTimeMonths = current.monthlySavings > 0 ? Math.ceil(debtCreated / current.monthlySavings) : 99;
            isApproved = false;
            aiAdvice = `Reprovado. Essa compra à vista te deixará negativo e levará ${recoveryTimeMonths} meses para você se recuperar.`;
        } else {
            // Afeta liquidez, mas tem dinheiro
            projectedScoreDrop = purchase.value > (current.balance * 0.5) ? 5 : 0;
            recoveryTimeMonths = current.monthlySavings > 0 ? Math.ceil(purchase.value / current.monthlySavings) : 0;
            aiAdvice = `Aprovado. Você tem saldo, mas consumirá ${( (purchase.value / current.balance) * 100 ).toFixed(0)}% da sua liquidez atual.`;
        }
    } else {
        // Parcelado
        const monthlyInstallment = purchase.value / (purchase.installments || 1);
        const newCommittedIncome = monthlyInstallment / current.monthlyIncome;
        
        if (newCommittedIncome > 0.15 && !purchase.isEssential) {
            projectedScoreDrop = 10;
            isApproved = false;
            aiAdvice = `Reprovado. Essa parcela compromete mais de 15% da sua renda mensal com algo não essencial.`;
        } else {
            projectedScoreDrop = newCommittedIncome > 0.05 ? 2 : 0;
            aiAdvice = `Aprovado. A parcela de R$ ${monthlyInstallment.toFixed(2)} cabe no seu fluxo de caixa.`;
        }
        recoveryTimeMonths = purchase.installments || 1;
        newBalance -= monthlyInstallment; // Impacto do primeiro mês
    }

    // Se a meta é essencial, a IA é mais boazinha
    if (purchase.isEssential && !isApproved && newBalance + current.emergencyFund > purchase.value) {
        isApproved = true;
        aiAdvice = "Atenção: Compra essencial aprovada, mas você precisará acionar sua Reserva de Emergência.";
    }

    return {
        isApproved,
        newBalance,
        projectedScoreDrop,
        recoveryTimeMonths,
        aiAdvice
    };
}