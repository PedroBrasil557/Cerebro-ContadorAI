import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cérebro.OS | Motor Financeiro",
  description: "A inteligência financeira definitiva com IA cognitiva integrada.",
  icons: {
    // Truque mestre: Um SVG gerado por código usando um emoji como logo temporária!
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
      <body className={`${inter.className} bg-[#050505] text-white antialiased`} suppressHydrationWarning>
        {children}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}