import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <body className="bg-white text-black antialiased">{children}</body>
    </html>
  );
}