'use client'

import { Navbar } from '@/components/navbar'
import { usePathname } from 'next/navigation'

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Coding round page uses full-height layout without padding
  const isRoundPage = /\/pipeline\/[^/]+\/round\//.test(pathname)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={`flex-1 ${isRoundPage ? '' : 'mx-auto w-full max-w-5xl px-6 py-8'}`}>
        {children}
      </main>
    </div>
  )
}
