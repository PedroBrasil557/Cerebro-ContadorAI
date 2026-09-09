'use client'

import { Wrench } from 'lucide-react'

export default function NailServiceManager() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] p-8 text-center">
      <Wrench className="mb-4 text-pink-400" />
      <h3 className="font-bold text-white">Catálogo sem dados cadastrados</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        O catálogo persistente ainda não está disponível. Nenhum preço ou serviço de demonstração é exibido como dado real.
      </p>
    </div>
  )
}
