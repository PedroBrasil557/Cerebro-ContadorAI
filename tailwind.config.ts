// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  // Configurado para tema automático (Dark Mode do OS)
  darkMode: 'media', 
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // NOVOS TONS ESCUROS (Baseados na imagem #191C24)
        'background-dark': '#191C24', 
        'card-dark': '#21252D', // Tom ligeiramente mais claro para os cards
        'text-light-dark': '#DEE2E6', // Texto branco suave em dark mode

        // Cores de destaque (mantidas)
        'brand-violet': '#6C63FF', 
        'brand-violet-dark': '#564CE0', 
        'summary-green-icon': '#10B981',
        'summary-red-icon': '#EF4444',
        'summary-blue-icon': '#3B82F6', 
        'summary-yellow-icon': '#F59E0B',

        // Tons claros (mantidos como fallback)
        'background-light': '#F8F9FA',
        'sidebar-light': '#FFFFFF',
        'text-dark': '#212529',
        'text-light': '#6C757D',
      },
      borderRadius: {
        'lg': '0.75rem', 
        'xl': '1rem',   
        '2xl': '1.25rem', // 20px
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), 
  ],
}
export default config