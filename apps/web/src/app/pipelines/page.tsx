'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { ChevronRight } from 'lucide-react'

interface Pipeline {
  id: string
  company: string
  role: string
  description: string
  totalRounds: number
  rounds: Array<{
    id: string
    name: string
    roundType: string
    durationMinutes: number
  }>
}

const ROUND_TYPE_LABELS: Record<string, string> = {
  oa: 'OA',
  coding: 'Coding',
  phone_screen: 'Phone',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  mixed: 'Mixed',
}

const BADGE_STYLES: Record<string, string> = {
  oa: 'bg-[#3B82F6]/15 text-[#93C5FD]',
  coding: 'bg-[#10B981]/15 text-[#6EE7B7]',
  phone_screen: 'bg-[#06B6D4]/15 text-[#67E8F9]',
  system_design: 'bg-[#8B5CF6]/15 text-[#C4B5FD]',
  behavioral: 'bg-[#F97316]/15 text-[#FDBA74]',
  mixed: 'bg-[#64748B]/15 text-[#94A3B8]',
}

const COMPANY_COLORS: Record<string, string> = {
  Google: 'bg-[#4285F4]',
  Amazon: 'bg-[#FF9900]',
  Meta: 'bg-[#0668E1]',
  Microsoft: 'bg-[#7FBA00]',
  Flipkart: 'bg-[#2874F0]',
  Razorpay: 'bg-[#3395FF]',
  Netflix: 'bg-[#E50914]',
  Apple: 'bg-[#555555]',
}

const COMPANY_GRADIENTS: Record<string, string> = {
  Google: 'from-[#4285F4]/10 to-transparent',
  Amazon: 'from-[#FF9900]/10 to-transparent',
  Meta: 'from-[#0668E1]/10 to-transparent',
  Microsoft: 'from-[#7FBA00]/10 to-transparent',
  Flipkart: 'from-[#2874F0]/10 to-transparent',
  Razorpay: 'from-[#3395FF]/10 to-transparent',
  Netflix: 'from-[#E50914]/10 to-transparent',
  Apple: 'from-[#555555]/10 to-transparent',
}

function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  const colorClass = COMPANY_COLORS[pipeline.company] || 'bg-[#2563EB]'
  const gradientClass = COMPANY_GRADIENTS[pipeline.company] || 'from-[#2563EB]/10 to-transparent'
  const totalMinutes = pipeline.rounds.reduce((sum, r) => sum + r.durationMinutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const durationLabel = hours > 0 ? `~${hours}h ${mins > 0 ? `${mins}m` : ''}` : `~${mins}m`

  return (
    <Link href={`/pipelines/${encodeURIComponent(pipeline.company)}`}>
      <div
        className={`group relative overflow-hidden rounded-xl border border-[#1E2535] bg-gradient-to-br ${gradientClass} bg-[#161B26] p-5 transition-all cursor-pointer hover:border-[#2563EB]/40 hover:shadow-[0_0_16px_rgba(37,99,235,0.12)]`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass} text-lg font-bold text-white shadow-lg`}
            >
              {pipeline.company[0]}
            </div>
            <div>
              <p className="font-semibold text-white">{pipeline.company}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{pipeline.role}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#64748B] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-[#64748B]">
          <span>{pipeline.totalRounds} rounds</span>
          <span>·</span>
          <span>{durationLabel} total</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {pipeline.rounds.map((r) => (
            <span
              key={r.id}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_STYLES[r.roundType] || BADGE_STYLES.mixed}`}
            >
              {ROUND_TYPE_LABELS[r.roundType] || r.roundType}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export default function PipelinesPage() {
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) {
      router.push('/auth/login')
      return
    }
    api.pipelines
      .list(token)
      .then((data) => setPipelines(data.pipelines || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, _hasHydrated, router])

  if (!_hasHydrated || !token) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA] mb-2">
          Interview Prep
        </p>
        <h1 className="text-[48px] font-extrabold leading-none tracking-tight text-white">
          Choose Your Interview
        </h1>
        <p className="mt-3 text-base text-[#94A3B8]">
          Experience the exact hiring process for your dream company
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl bg-[#1E2535]" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20 bg-[#1E2535]" />
                  <Skeleton className="h-3 w-28 bg-[#1E2535]" />
                </div>
              </div>
              <Skeleton className="h-3 w-24 bg-[#1E2535]" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-12 rounded-full bg-[#1E2535]" />
                <Skeleton className="h-5 w-16 rounded-full bg-[#1E2535]" />
                <Skeleton className="h-5 w-12 rounded-full bg-[#1E2535]" />
              </div>
            </div>
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1E2535] p-16 text-center">
          <p className="text-sm text-[#64748B]">No pipelines available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {pipelines.map((p) => (
            <PipelineCard key={p.id} pipeline={p} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-[#334155]">
        More companies coming soon — Amazon, Meta, Microsoft pipelines launching next
      </p>
    </div>
  )
}
