import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner' // <--- Importante

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cérebro.AI Financeiro',
  description: 'Sistema de Gestão Inteligente',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        {children}
        {/* Componente de Notificações Profissionais */}
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  )
}