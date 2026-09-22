import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { BRAND } from '@/lib/branding'
import { CerebroMotionProvider } from '@/core/motion/CerebroMotionProvider'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      <body
        className={`${inter.variable} bg-background text-foreground font-sans antialiased`}
        suppressHydrationWarning
      >
        <CerebroMotionProvider>
          {children}
        </CerebroMotionProvider>
        <Toaster position="top-center" richColors theme="system" />
      </body>
    </html>
  );
}
