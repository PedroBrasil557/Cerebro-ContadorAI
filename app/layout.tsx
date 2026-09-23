import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from '@/lib/branding'
import { CerebroMotionProvider } from '@/core/motion/CerebroMotionProvider'
import { CerebroThemeProvider } from '@/core/theme/CerebroThemeProvider'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const themeBootstrapScript = `
(function () {
  try {
    var stored = window.localStorage.getItem('cerebro-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

export const metadata: Metadata = {
  title: `${BRAND.name} | ${BRAND.tagline}`,
  description: "A inteligência financeira definitiva com IA cognitiva integrada.",
  icons: {
    icon: BRAND.assets.appIcon.light,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body
        className={`${inter.variable} bg-background text-foreground font-sans antialiased`}
        suppressHydrationWarning
      >
        <CerebroThemeProvider>
          <CerebroMotionProvider>
            {children}
          </CerebroMotionProvider>
        </CerebroThemeProvider>
      </body>
    </html>
  );
}
