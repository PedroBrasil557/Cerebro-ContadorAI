import { Transaction } from '@/types_db';

type BehaviorProfile = 'Estratégico' | 'Estável' | 'Reativo' | 'Impulsivo' | 'Em Risco' | 'Estagnado';

export interface BehaviorAnalysis {
    profile: BehaviorProfile;
    impulseBuyRatio: number;
    microExpensesTotal: number;
    warningMessage: string | null;
}

export function calculateBehaviorProfile(transactions: Transaction[], currentBalance: number): BehaviorAnalysis {
    if (!transactions || transactions.length === 0) {
        return { profile: 'Estagnado', impulseBuyRatio: 0, microExpensesTotal: 0, warningMessage: 'Faltam dados para análise.' };
    }

    const expenses = transactions.filter(t => t.type !== 'receita');
    const totalSpent = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
    
    // 1. Identificar gastos pequenos e frequentes (Micro-gastos) - Ex: Ifood todo dia, cafezinho
    const microExpenses = expenses.filter(t => Number(t.amount) < 50);
    const microExpensesTotal = microExpenses.reduce((acc, t) => acc + Number(t.amount), 0);
    const microExpenseRatio = totalSpent > 0 ? microExpensesTotal / totalSpent : 0;

    // 2. Identificar gastos por impulso (Supérfluos nos fins de semana ou noite)
    const impulsePurchases = expenses.filter(t => {
        const date = new Date(t.date);
        const day = date.getDay(); // 0 = Domingo, 6 = Sábado
        const isWeekend = day === 0 || day === 5 || day === 6;
        const isNonEssential = ['Lazer', 'Restaurante', 'Compras', 'Outros'].includes(t.category || '');
        return isWeekend && isNonEssential;
    });
    
    const impulseTotal = impulsePurchases.reduce((acc, t) => acc + Number(t.amount), 0);
    const impulseBuyRatio = totalSpent > 0 ? impulseTotal / totalSpent : 0;

    // 3. Definir o Perfil Cognitivo
    let profile: BehaviorProfile = 'Estável';
    let warningMessage = null;

    if (currentBalance < 0 || (currentBalance < totalSpent * 0.1 && impulseBuyRatio > 0.4)) {
        profile = 'Em Risco';
        warningMessage = 'Cuidado! Seu saldo está baixo e o nível de compras por impulso está muito alto.';
    } else if (impulseBuyRatio > 0.3 || microExpenseRatio > 0.25) {
        profile = 'Impulsivo';
        warningMessage = 'Seus pequenos gastos e compras de fim de semana estão drenando seu dinheiro.';
    } else if (impulseBuyRatio < 0.1 && microExpenseRatio < 0.1 && currentBalance > totalSpent) {
        profile = 'Estratégico';
    } else if (expenses.length > 0 && impulseBuyRatio > 0.15) {
        profile = 'Reativo';
    }

    return {
        profile,
        impulseBuyRatio: Number((impulseBuyRatio * 100).toFixed(1)),
        microExpensesTotal,
        warningMessage
    };
}