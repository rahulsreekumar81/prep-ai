import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrepAI — AI Interview Preparation',
  description: 'Crack your dream interview with AI-powered mock interviews, personalized feedback, and company-specific preparation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
