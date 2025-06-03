import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FLUCOR System',
  description: 'Sistema interno da Flucor',
  generator: 'Next.js',
  applicationName: 'FLUCOR System',
  authors: [{ name: 'Marcos' }],
  colorScheme: 'light',
  themeColor: '#ffffff',
  viewport: 'width=device-width, initial-scale=1.0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head />
      <body className="bg-white text-black antialiased">{children}</body>
    </html>
  )
}