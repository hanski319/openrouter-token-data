import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Token Usage Open Router',
  description: 'Historical weekly token usage rankings for top OpenRouter models',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
        {children}
      </body>
    </html>
  )
}
