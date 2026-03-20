import { Sidebar } from '@/components/sidebar'

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0F14]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
