import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowDesk - Gestão B2B",
  description: "Plataforma de gestão de solicitações e processos internos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-950 text-slate-200 antialiased h-screen flex overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto bg-slate-950 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
