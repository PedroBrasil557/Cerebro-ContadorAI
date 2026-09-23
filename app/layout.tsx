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

const themeBootstrapScript = `(() => {
  try {
    const key = 'cerebro-theme';
    const stored = window.localStorage.getItem(key);
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();`;

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
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
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
