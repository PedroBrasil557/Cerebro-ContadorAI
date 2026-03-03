'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingDown, ShieldAlert, Plus, X, 
  Banknote, Calendar, Zap, CheckCircle2, Loader2, BrainCircuit, Sparkles
} from 'lucide-react'
import { getDebts, createDebt, updateDebt, deleteDebt, Debt } from '@/core/action/debts'
import { financeService } from '@/services/financeService' 
import { toast } from 'sonner'

// --- MODAL NOVA DÍVIDA ---
function NewDebtModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        await createDebt(formData)
        setLoading(false)
        onSuccess()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><ShieldAlert className="text-rose-500"/> Nova Dívida</h3>
                <p className="text-xs text-gray-400 mb-6">Registre para a IA traçar um plano.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Nome da Dívida</label><input name="name" required placeholder="Ex: Empréstimo Banco X" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Valor Total (R$)</label><input name="total_amount" type="number" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Falta Pagar (R$)</label><input name="remaining_amount" type="number" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Juros Mensal (%)</label><input name="interest_rate" type="number" step="0.01" placeholder="Ex: 2.5" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none" /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Dia Vencimento</label><input name="due_day" type="number" max="31" placeholder="Ex: 10" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none" /></div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Prioridade</label>
                        <select name="priority" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-rose-500/50 outline-none [color-scheme:dark]">
                            <option value="alta" className="bg-[#1a1a1a]">Alta (Urgente)</option>
                            <option value="media" className="bg-[#1a1a1a]">Média</option>
                            <option value="baixa" className="bg-[#1a1a1a]">Baixa</option>
                        </select>
                    </div>
                    <button disabled={loading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all">{loading ? 'Salvando...' : 'Registrar Dívida'}</button>
                </form>
            </motion.div>
        </div>
    )
}

// --- COMPONENTE PRINCIPAL ---
export default function DebtCenterView({ summary }: { summary: any }) {
    const [debts, setDebts] = useState<Debt[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [strategy, setStrategy] = useState<string | null>(null)
    const [analyzing, setAnalyzing] = useState(false)

    // Estados para o NOVO Modal de Pagamento (Fim do 'localhost diz')
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [isPaying, setIsPaying] = useState(false)

    // Carrega Dívidas
    const loadDebts = async () => {
        const data = await getDebts()
        setDebts(data)
        setLoading(false)
    }
    useEffect(() => { loadDebts() }, [])

    const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    // Totais
    const totalDebt = debts.reduce((acc, d) => acc + Number(d.remaining_amount), 0)
    const totalMonthlyInterest = debts.reduce((acc, d) => acc + (Number(d.remaining_amount) * (Number(d.interest_rate) / 100)), 0)

    // --- CÉREBRO.AI: ESTRATÉGIA DE DÍVIDAS (GROQ API) ---
    const generateStrategy = async () => {
        if (debts.length === 0) return toast.success("Você não tem dívidas para analisar! Parabéns!")
        setAnalyzing(true)
        
        try {
            const transactions = await financeService.getTransactions()
            const response = await fetch('/api/ai/debt-strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ debts: debts, transactions: transactions })
            })

            if (!response.ok) throw new Error("Falha na API")
            const data = await response.json()
            setStrategy(data.strategy)
            toast.success("Estratégia gerada com sucesso!")

        } catch (e) {
            console.error(e)
            toast.error("Erro ao gerar estratégia. Verifique a configuração da API e se o servidor foi reiniciado.")
        } finally {
            setAnalyzing(false)
        }
    }

    // --- LÓGICA DO NOVO PAGAMENTO ---
    const openPaymentModal = (id: string) => {
        setSelectedDebtId(id)
        setPaymentAmount('')
        setPaymentModalOpen(true)
    }

    const confirmPayment = async () => {
        if (!selectedDebtId || !paymentAmount || isNaN(Number(paymentAmount))) return
        
        setIsPaying(true)
        try {
            await updateDebt(selectedDebtId, Number(paymentAmount))
            await loadDebts()
            toast.success("Pagamento registrado! Rumo à liberdade financeira.")
            setPaymentModalOpen(false)
        } catch (error) {
            toast.error("Erro ao registrar pagamento.")
        } finally {
            setIsPaying(false)
        }
    }

    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-rose-500"/></div>

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 pb-32 animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        Central de Dívidas <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-lg border border-rose-500/20 font-bold uppercase">Área Crítica</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Gerenciamento inteligente para sua liberdade financeira.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-rose-900/20">
                    <Plus size={20} /> Nova Dívida
                </button>
            </div>

            {/* Resumo de Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#121214] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total em Dívidas</p>
                        <h3 className="text-3xl font-black text-rose-500">{format(totalDebt)}</h3>
                    </div>
                    <div className="absolute right-0 top-0 p-20 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"/>
                </div>
                <div className="bg-[#121214] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Juros Estimados / Mês</p>
                        <h3 className="text-3xl font-black text-amber-500">~ {format(totalMonthlyInterest)}</h3>
                        <p className="text-[10px] text-gray-500 mt-1">Dinheiro perdido passivamente</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-center items-start group">
                    <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="relative z-10 w-full">
                        <button 
                            onClick={generateStrategy} 
                            disabled={analyzing}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-70"
                        >
                            {analyzing ? <Loader2 className="animate-spin" size={18}/> : <BrainCircuit size={18} />}
                            {analyzing ? 'A IA está analisando...' : 'Gerar Plano de Resgate'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUNA 1: LISTA DE DÍVIDAS */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingDown size={18} className="text-rose-500"/> Suas Pendências</h3>
                    {debts.length === 0 ? (
                        <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-gray-500">
                            <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500/50"/>
                            <p>Nenhuma dívida registrada. Você está livre!</p>
                        </div>
                    ) : (
                        debts.map(debt => {
                            const progress = ((Number(debt.total_amount) - Number(debt.remaining_amount)) / Number(debt.total_amount)) * 100
                            return (
                                <motion.div 
                                    key={debt.id} 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#121214] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{debt.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400">Juros: {debt.interest_rate}%</span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${debt.priority === 'alta' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    Prioridade {debt.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Resta Pagar</p>
                                            <p className="text-xl font-black text-white">{format(Number(debt.remaining_amount))}</p>
                                        </div>
                                    </div>

                                    {/* Barra de Progresso */}
                                    <div className="h-2 w-full bg-black rounded-full overflow-hidden mb-4">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" 
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Calendar size={14}/> Vence dia <span className="text-white font-bold">{debt.due_day}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => deleteDebt(debt.id)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-rose-500 transition"><X size={16}/></button>
                                            
                                            {/* BOTAO ATUALIZADO QUE ABRE O MODAL */}
                                            <button onClick={() => openPaymentModal(debt.id)} className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold transition border border-emerald-500/20">
                                                <Banknote size={14}/> Abater Valor
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>

                {/* COLUNA 2: CÉREBRO DA IA */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={18} className="text-amber-400"/> Plano de Ação Inteligente</h3>
                    
                    <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 md:p-8 min-h-[400px]">
                        {strategy ? (
                            <div className="prose prose-invert prose-sm max-w-none overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed font-light text-sm md:text-base">
                                    {strategy}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4 pt-12">
                                <BrainCircuit size={64} className="text-indigo-500 animate-pulse"/>
                                <div>
                                    <p className="text-lg font-bold text-white">Aguardando Análise</p>
                                    <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">
                                        Clique em "Gerar Plano de Resgate" para que a IA analise suas receitas, despesas e dívidas.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* MODAIS (NOVA DÍVIDA E PAGAMENTO) */}
            <AnimatePresence>
                {isModalOpen && <NewDebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadDebts} />}
                
                {paymentModalOpen && selectedDebtId && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm bg-[#09090b] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                            <button onClick={() => setPaymentModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                            
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Banknote className="text-emerald-500"/> Registrar Pagamento</h3>
                            <p className="text-xs text-gray-400 mb-6">Informe o valor exato que você abateu desta dívida hoje.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Valor Pago (R$)</label>
                                    <input 
                                        type="number" step="0.01" 
                                        value={paymentAmount} 
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="Ex: 150.00" 
                                        autoFocus
                                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none" 
                                    />
                                </div>
                                <button 
                                    onClick={confirmPayment}
                                    disabled={!paymentAmount || Number(paymentAmount) <= 0 || isPaying}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isPaying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    {isPaying ? 'Registrando...' : 'Confirmar Abatimento'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}