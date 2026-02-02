import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cérebro Financial AI",
  description: "Seu sistema operacional financeiro.",
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