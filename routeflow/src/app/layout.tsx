import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RouteFlow — Planejador de Rotas",
  description:
    "Encontre a sequência mais eficiente para visitar seus destinos. Otimização de rotas com OpenStreetMap, Nominatim e OSRM.",
  applicationName: "RouteFlow",
  keywords: ["rotas", "otimização de rotas", "logística", "entregas", "OpenStreetMap"],
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
