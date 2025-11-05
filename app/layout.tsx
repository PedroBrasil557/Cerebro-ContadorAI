// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// Esta é a importação mais importante, que carrega o Tailwind
import './globals.css' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cérebro Finance',
  description: 'Seu app de gerenciamento financeiro pessoal.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // A tag 'suppressHydrationWarning' foi removida,
    // pois não é mais necessária com o 'darkMode: "media"'
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* 'children' aqui será o seu 'app/page.tsx' */}
        {children}
      </body>
    </html>
  )
}