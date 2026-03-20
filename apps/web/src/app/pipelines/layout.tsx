import { Sidebar } from '@/components/sidebar'

export default function PipelinesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0F14]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[900px] px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
