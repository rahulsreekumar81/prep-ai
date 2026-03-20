'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRoundPage = /\/pipeline\/[^/]+\/round\//.test(pathname)

  if (isRoundPage) {
    // Full-screen layout for round sessions — no sidebar, no padding
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#0D0F14]">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0F14]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
