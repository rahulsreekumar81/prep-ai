'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'

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

const ROUND_TYPE_COLORS: Record<string, string> = {
  oa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  coding: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  phone_screen: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  system_design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  behavioral: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  mixed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const ROUND_TYPE_LABELS: Record<string, string> = {
  oa: 'OA',
  coding: 'Coding',
  phone_screen: 'Phone',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  mixed: 'Mixed',
}

const COMPANY_COLORS: Record<string, string> = {
  Google: 'bg-blue-500',
  Amazon: 'bg-orange-500',
  Meta: 'bg-blue-600',
  Microsoft: 'bg-green-600',
  Flipkart: 'bg-yellow-500',
  Razorpay: 'bg-indigo-500',
}

function RoundBadge({ type }: { type: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROUND_TYPE_COLORS[type] || ROUND_TYPE_COLORS.mixed}`}>
      {ROUND_TYPE_LABELS[type] || type}
    </span>
  )
}

function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  const color = COMPANY_COLORS[pipeline.company] || 'bg-gray-500'
  const totalMinutes = pipeline.rounds.reduce((sum, r) => sum + r.durationMinutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const durationLabel = hours > 0 ? `~${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `~${minutes}m`

  return (
    <Link href={`/pipelines/${encodeURIComponent(pipeline.company)}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-lg ${color}`}>
              {pipeline.company[0]}
            </div>
            <div>
              <p className="font-semibold leading-tight">{pipeline.company}</p>
              <p className="text-xs text-muted-foreground">{pipeline.role}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {pipeline.totalRounds} rounds · {durationLabel} total
          </p>
          <div className="flex flex-wrap gap-1">
            {pipeline.rounds.map((r) => (
              <RoundBadge key={r.id} type={r.roundType} />
            ))}
          </div>
        </CardContent>
      </Card>
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Choose Your Interview</h1>
        <p className="text-sm text-muted-foreground">
          Select a company to start their real hiring pipeline
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No pipelines available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((p) => (
            <PipelineCard key={p.id} pipeline={p} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        More companies coming soon — Amazon, Meta, Microsoft pipelines launching next
      </p>
    </div>
  )
}
