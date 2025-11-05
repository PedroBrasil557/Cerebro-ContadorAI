// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'media', 
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TONS DE DARK MODE QUE FUNCIONAM
        'background-dark': '#2D3748', // Fundo principal (Azul Escuro Suave)
        'card-dark': '#2D3748', // Cor dos cards (Mais claro que o fundo)
        'text-light-dark': '#FFFFFF', // Texto principal no dark mode (Branco)
        'text-secondary-dark': '#CBD5E0', // Texto secundário (Cinza Suave)

        // Cores de destaque (Voltam para o roxo/verde/vermelho padrão de UI)
        'brand-violet': '#7C3AED', 
        'brand-violet-dark': '#6D28D9', 
        'summary-green-icon': '#4CAF50', 
        'summary-red-icon': '#F44336',   
        'summary-blue-icon': '#2196F3', 
        'summary-yellow-icon': '#FFC107',

        // Tons claros (mantidos como fallback)
        'background-light': '#F8F9FA',
        'sidebar-light': '#FFFFFF',
        'text-dark': '#212529',
        'text-light': '#6C757D',
      },
      borderRadius: {
        'lg': '0.75rem', 
        'xl': '1rem',   
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), 
  ],
}
export default config