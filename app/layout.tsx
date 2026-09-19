import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { BRAND } from '@/lib/branding'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: `${BRAND.name} | ${BRAND.tagline}`,
  description: "A inteligência financeira definitiva com IA cognitiva integrada.",
  icons: {
    // TODO(brand): replace the temporary emoji with the final Cérebro mark.
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>",
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
        {children}
        <Toaster position="top-center" richColors theme="system" />
      </body>
    </html>
  );
}
