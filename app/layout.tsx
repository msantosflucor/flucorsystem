import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers"; // 👈 Importação aqui

export const metadata: Metadata = {
  title: "FLUCOR System",
  description: "Sistema interno da Flucor",
  generator: "Next.js",
  applicationName: "FLUCOR System",
  authors: [{ name: "Marcos" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head />
      <body className="bg-white text-black antialiased">
        <Providers> {/* 👈 Envolve a aplicação */}
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}