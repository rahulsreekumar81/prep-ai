'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, BookOpen, BarChart3, FileText, Zap } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipelines', label: 'Interviews', icon: BookOpen },
  { href: '/dashboard/resources', label: 'Resources', icon: FileText },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[240px] flex-shrink-0 flex-col border-r border-[#1E2535] bg-[#141720]">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-[#1E2535]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">PrepAI</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#94A3B8] hover:bg-[#161B26] hover:text-white',
              )}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Pro Plan card */}
      <div className="p-3">
        <div className="rounded-xl border border-[#2563EB]/40 bg-[#172554]/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#60A5FA]">Pro Plan</p>
          <p className="mt-1 text-xs text-[#94A3B8]">Unlock unlimited interviews & analytics</p>
          <button className="mt-3 w-full rounded-[8px] border border-[#2563EB]/60 bg-transparent px-3 py-1.5 text-xs font-semibold text-[#60A5FA] transition-colors hover:bg-[#2563EB]/10">
            Manage
          </button>
        </div>
      </div>
    </aside>
  )
}
