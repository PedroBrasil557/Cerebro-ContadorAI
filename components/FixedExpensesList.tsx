'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Circle, AlertTriangle, CalendarClock, 
  TrendingUp, TrendingDown, Check, ShieldCheck, Copy, Calendar
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Transaction, toggleBillPayment, copyFixedTransactionsToMonth } from '@/app/action/transactions'

export default function FixedExpensesList({ 
    transactions, 
    currentDate 
}: { 
    transactions: Transaction[], 
    currentDate: Date 
}) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [isCopying, setIsCopying] = useState(false)

    // 1. FILTRAGEM PELO MÊS SELECIONADO
    const currentMonthStr = currentDate.toISOString().slice(0, 7) 
    
    // Pega só as transações FIXAS que pertencem ao MÊS SELECIONADO
    const fixedItems = transactions
        .filter(t => t.is_fixed && t.date.startsWith(currentMonthStr))
        .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())

    // 2. SEPARAÇÃO (Receitas vs Despesas)
    const fixedIncomes = fixedItems.filter(t => t.type === 'receita')
    const fixedExpenses = fixedItems.filter(t => t.type !== 'receita')

    // 3. ACTIONS
    const handleToggle = async (t: Transaction) => {
        setLoadingId(t.id)
        // Inverte o status: Se estava pago, vira pendente
        await toggleBillPayment(t.id, !t.is_paid)
        setLoadingId(null)
        router.refresh()
    }

    const handleStartMonth = async () => {
        const confirmMsg = `Deseja copiar as contas fixas e salário do mês anterior para ${currentDate.toLocaleDateString('pt-BR', { month: 'long' })}?`
        if(!confirm(confirmMsg)) return

        setIsCopying(true)
        const targetDateStr = currentDate.toISOString().split('T')[0]
        const res = await copyFixedTransactionsToMonth(targetDateStr)
        
        setIsCopying(false)
        if (res.success) {
            router.refresh()
        } else {
            alert(res.message || "Erro ao iniciar o mês.")
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    const getDay = (dateStr: string) => new Date(dateStr).getUTCDate()

    // 4. ESTADO VAZIO (BOTÃO DE INICIAR MÊS)
    if (fixedItems.length === 0) {
        return (
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-8 mb-6 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500 mb-4 border border-blue-500/20">
                    <Calendar size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mês não iniciado</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                    Ainda não há contas fixas ou salários registrados para este mês. Deseja importar suas contas recorrentes do mês anterior?
                </p>
                <button 
                    onClick={handleStartMonth}
                    disabled={isCopying}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50 shadow-lg shadow-blue-900/20"
                >
                    {isCopying ? (
                        <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Preparando Mês...</span>
                    ) : (
                        <><Copy size={18} /> Iniciar Mês e Importar Contas</>
                    )}
                </button>
            </div>
        )
    }

    // CÁLCULOS DO RESUMO
    const totalFixed = fixedExpenses.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)
    const totalPaid = fixedExpenses.filter(t => t.is_paid).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)
    const remaining = totalFixed - totalPaid
    const progressPercent = totalFixed > 0 ? (totalPaid / totalFixed) * 100 : 0

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* CARD DE RESUMO (APENAS SE TIVER DESPESAS) */}
            {fixedExpenses.length > 0 && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121214] to-[#0a0a0a] border border-white/10 p-6 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6 relative z-10">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                                <ShieldCheck className="text-blue-500" size={20} /> 
                                Compromissos Mensais
                            </h3>
                            <p className="text-sm text-gray-400">Gerencie suas contas fixas e recorrentes.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Restante a Pagar</p>
                            <p className="text-2xl font-black text-white">{formatCurrency(remaining)}</p>
                        </div>
                    </div>

                    <div className="relative h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className={`h-full rounded-full ${
                                progressPercent === 100 
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                                    : 'bg-gradient-to-r from-blue-600 to-purple-500'
                            }`}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <span>{progressPercent.toFixed(0)}% Pago</span>
                        <span>Total: {formatCurrency(totalFixed)}</span>
                    </div>
                </div>
            )}

            {/* SEÇÃO 1: SALÁRIO E ENTRADAS */}
            {fixedIncomes.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <TrendingUp size={14} /> Entradas Previstas (Salário)
                    </h3>
                    <AnimatePresence>
                        {fixedIncomes.map(t => (
                            <motion.div 
                                key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                    t.is_paid 
                                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                                        : 'bg-[#121214] border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => handleToggle(t)} 
                                        disabled={loadingId === t.id}
                                        className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                                            t.is_paid 
                                                ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                                : 'bg-white/5 text-gray-500 hover:bg-emerald-500 hover:text-white border border-white/10'
                                        }`}
                                    >
                                        {loadingId === t.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Check size={18}/>}
                                    </button>
                                    <div>
                                        <p className="font-bold text-white text-base">{t.description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {t.is_paid 
                                                ? <span className="text-emerald-400 font-bold">Recebido no sistema ✅</span> 
                                                : `Previsto para dia ${getDay(t.date)}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <span className="font-mono font-bold text-lg text-emerald-400">
                                    + {formatCurrency(t.amount)}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* SEÇÃO 2: CONTAS A PAGAR */}
            {fixedExpenses.length > 0 && (
                <div className="space-y-3 mt-6">
                    <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <TrendingDown size={14} /> Contas a Pagar
                    </h3>
                    <AnimatePresence>
                        {fixedExpenses.map(t => {
                            const todayDate = new Date().toISOString().split('T')[0]
                            const isOverdue = !t.is_paid && t.date < todayDate
                            
                            return (
                                <motion.div 
                                    key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                        t.is_paid 
                                            ? 'bg-[#09090b]/50 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100' 
                                            : isOverdue 
                                                ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                                                : 'bg-[#121214] border-white/10 hover:bg-[#1a1a1c]'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => handleToggle(t)}
                                            disabled={loadingId === t.id}
                                            className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
                                                t.is_paid 
                                                    ? 'bg-white/10 text-gray-400' 
                                                    : isOverdue
                                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                                                        : 'bg-white/5 text-gray-500 hover:bg-blue-600 hover:text-white border border-white/10'
                                            }`}
                                        >
                                            {loadingId === t.id ? (
                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : t.is_paid ? (
                                                <Check strokeWidth={3} size={20} />
                                            ) : (
                                                <span className="text-sm font-black">{getDay(t.date)}</span>
                                            )}
                                        </button>
                                        
                                        <div>
                                            <p className={`font-bold text-base ${t.is_paid ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                {t.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {isOverdue && !t.is_paid && (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase">
                                                        Atrasado
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">
                                                    {t.is_paid ? 'Pago' : `Vence dia ${getDay(t.date)}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className={`font-mono text-lg font-black tracking-tight ${
                                            t.is_paid ? 'text-gray-600' : 'text-rose-400'
                                        }`}>
                                            {formatCurrency(Math.abs(t.amount))}
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}