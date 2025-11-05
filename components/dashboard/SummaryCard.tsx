// components/dashboard/SummaryCards.tsx
'use client'

import React, { useState } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, Shield, DollarSign, ArrowUp, ArrowDown, LineChart, HelpCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'; 

type SummaryCardsProps = {
  currentBalance: number
  monthlyIncome: number
  monthlyExpense: number
  emergencyTotal: number
  emergencyTarget: number
  emergencyPercentage: number
  onAddReserve: (amount: number) => Promise<void> 
  onOpenTransactionModal: (type: 'income' | 'expense') => void; 
}

// Card Customizado (Revisado para incluir Botao de Acao)
const ActionCard = ({ icon: Icon, title, value, type, percentage, onActionClick }: any) => {
    const isEmergency = type === 'emergency';
    const isIncome = type === 'income';
    const trendIcon = isIncome ? ArrowUp : TrendingDown;
    const iconBg = isIncome ? 'bg-summary-green-bg' : type === 'expense' ? 'bg-summary-red-bg' : isEmergency ? 'bg-summary-yellow-bg' : 'bg-gray-100';
    const iconColor = isIncome ? 'text-summary-green-icon' : type === 'expense' ? 'text-summary-red-icon' : isEmergency ? 'text-summary-yellow-icon' : 'text-gray-700';

    const renderValue = () => {
        if (isEmergency && percentage !== undefined) {
            return (
                <>
                    {formatCurrency(value)}
                    <span className="ml-2 text-xs font-normal text-text-light dark:text-gray-400">
                        ({percentage.toFixed(0)}% da meta)
                    </span>
                </>
            )
        }
        return formatCurrency(value);
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg} ${iconColor}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Botão de Ação Rápida */}
          {onActionClick && (
            <button 
                onClick={onActionClick} 
                className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg} ${iconColor} opacity-80 hover:opacity-100 transition-opacity`}
                aria-label={isEmergency ? 'Adicionar Reserva' : `Adicionar ${title}`}
            >
              {isEmergency ? <Plus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          )}

        </div>
        <h4 className="mb-1 text-sm font-medium text-text-light">{title}</h4>
        <p className="text-2xl font-bold text-text-dark dark:text-white">
          {renderValue()}
        </p>
        {/* Métrica de Exemplo */}
        {!isEmergency && <div className="text-xs font-medium text-text-light mt-1 flex items-center gap-1">
            <span className="text-summary-green-icon"><ArrowUp className="h-4 w-4" /></span>
            +1.2% {title}
        </div>}
      </motion.div>
    )
}

export default function SummaryCards({
  currentBalance,
  monthlyIncome,
  monthlyExpense,
  emergencyTotal,
  emergencyTarget,
  emergencyPercentage,
  onAddReserve,
  onOpenTransactionModal,
}: SummaryCardsProps) {
  const [isAddReserveModalOpen, setIsAddReserveModalOpen] = useState(false);
  const [reserveAmount, setReserveAmount] = useState('');

  const handleAddReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(reserveAmount);
    if (isNaN(amount) || amount <= 0 || amount > currentBalance) {
        alert("Valor inválido. Não pode ser maior que o Saldo Atual.");
        return;
    }
    // A função onAddReserve no MainAppLayout fará a dedução do saldo
    await onAddReserve(amount); 
    setReserveAmount('');
    setIsAddReserveModalOpen(false);
  };

  return (
    <>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Saldo Atual */}
            <ActionCard
                icon={DollarSign}
                title="Saldo Atual"
                value={currentBalance}
                type="balance"
            />
            
            {/* Receita Mensal (Com botão para adicionar) */}
            <ActionCard
                icon={TrendingUp}
                title="Receita Mensal"
                value={monthlyIncome}
                type="income"
                onActionClick={() => onOpenTransactionModal('income')}
            />
            
            {/* Despesa Mensal (Com botão para adicionar) */}
            <ActionCard
                icon={TrendingDown}
                title="Despesa Mensal"
                value={monthlyExpense}
                type="expense"
                onActionClick={() => onOpenTransactionModal('expense')}
            />
            
            {/* Reserva de Emergência (Com botão para adicionar à reserva) */}
            <ActionCard
                icon={Shield}
                title="Reserva de Emergência"
                value={emergencyTotal}
                percentage={emergencyPercentage}
                type="emergency"
                onActionClick={() => setIsAddReserveModalOpen(true)}
            />
        </div>

        {/* Modal para Adicionar à Reserva de Emergência */}
        <AnimatePresence>
            {isAddReserveModalOpen && (
                <Modal 
                    isOpen={isAddReserveModalOpen} 
                    onClose={() => setIsAddReserveModalOpen(false)}
                    title="Aporte na Reserva de Emergência"
                >
                    <form onSubmit={handleAddReserveSubmit} className="space-y-4">
                        <p className="text-text-light text-sm">Seu saldo disponível é: <span className="font-semibold text-text-dark dark:text-white">{formatCurrency(currentBalance)}</span></p>
                        <div>
                            <label htmlFor="reserveAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Valor do Aporte
                            </label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    id="reserveAmount"
                                    name="reserveAmount"
                                    step="0.01"
                                    min="0.01"
                                    max={currentBalance}
                                    value={reserveAmount}
                                    onChange={(e) => setReserveAmount(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-violet focus:ring-brand-violet dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                    placeholder="Ex: 500.00"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddReserveModalOpen(false)}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="rounded-md border border-transparent bg-brand-violet px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-violet-dark"
                            >
                                Confirmar Aporte
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AnimatePresence>
    </>
  )
}