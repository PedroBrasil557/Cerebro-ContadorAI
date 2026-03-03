export interface HistoricalItem {
    name: string;
    price: number;
    date: Date;
}

export interface ConsumptionInsight {
    type: 'inflation_alert' | 'optimization' | 'stable';
    message: string;
    impactLevel: 'low' | 'medium' | 'high';
    priceVariationPct: number;
}

export function detectPriceInflation(itemName: string, history: HistoricalItem[], currentCountryInflation: number = 4.5): ConsumptionInsight {
    if (history.length < 2) {
        return { type: 'stable', message: 'Sem histórico suficiente.', impactLevel: 'low', priceVariationPct: 0 };
    }

    // Ordena do mais antigo pro mais novo
    const sortedHistory = [...history].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const oldestPrice = sortedHistory[0].price;
    const newestPrice = sortedHistory[sortedHistory.length - 1].price;
    
    const variationPct = ((newestPrice - oldestPrice) / oldestPrice) * 100;
    
    // Se o aumento for maior que a inflação do país + 2%
    if (variationPct > (currentCountryInflation + 2)) {
        return {
            type: 'inflation_alert',
            message: `Alerta: O item '${itemName}' subiu ${variationPct.toFixed(1)}% recentemente, muito acima da inflação padrão.`,
            impactLevel: variationPct > 15 ? 'high' : 'medium',
            priceVariationPct: variationPct
        };
    } else if (variationPct < -5) {
        return {
            type: 'optimization',
            message: `Boa notícia: '${itemName}' está ${Math.abs(variationPct).toFixed(1)}% mais barato que sua média. Ótimo momento para estocar.`,
            impactLevel: 'low',
            priceVariationPct: variationPct
        };
    }

    return {
        type: 'stable',
        message: `'${itemName}' está com preço estável.`,
        impactLevel: 'low',
        priceVariationPct: variationPct
    };
}