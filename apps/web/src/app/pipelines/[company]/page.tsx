'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ArrowLeft, Clock, Hash, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface Round {
  id: string
  name: string
  roundType: string
  orderIndex: number
  durationMinutes: number
  questionCount: number
  description: string
  passingScore: number
}

interface Pipeline {
  id: string
  company: string
  role: string
  description: string
  totalRounds: number
  rounds: Round[]
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
  phone_screen: 'Phone Screen',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  mixed: 'Mixed',
}

function RoundBadge({ type }: { type: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROUND_TYPE_COLORS[type] || ROUND_TYPE_COLORS.mixed}`}>
      {ROUND_TYPE_LABELS[type] || type}
    </span>
  )
}

function RoundCard({ round, index }: { round: Round; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-medium">{round.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <RoundBadge type={round.roundType} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {round.durationMinutes} min
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {round.questionCount} {round.questionCount === 1 ? 'question' : 'questions'}
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 pt-3 border-t">
          <p className="text-sm text-muted-foreground">{round.description}</p>
          <p className="text-xs text-muted-foreground">
            Passing score: {round.passingScore}/10
          </p>
        </div>
      )}
    </div>
  )
}

export default function PipelineDetailPage() {
  const { company } = useParams<{ company: string }>()
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()

  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [jobDescription, setJobDescription] = useState('')

  const decodedCompany = decodeURIComponent(company)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) {
      router.push('/auth/login')
      return
    }
    api.pipelines
      .byCompany(token, decodedCompany)
      .then((data) => setPipeline(data.pipelines?.[0] || null))
      .catch(() => toast.error('Failed to load pipeline'))
      .finally(() => setLoading(false))
  }, [token, _hasHydrated, decodedCompany, router])

  const handleStart = async () => {
    if (!token || !pipeline) return
    setStarting(true)
    try {
      const result = await api.pipelines.startAttempt(token, {
        pipelineId: pipeline.id,
        jobDescription: jobDescription || undefined,
      })
      router.push(`/pipeline/${result.attemptId}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to start pipeline')
    } finally {
      setStarting(false)
    }
  }

  if (!_hasHydrated || !token) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pipelines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Pipeline not found for {decodedCompany}.</p>
      </div>
    )
  }

  const totalMinutes = pipeline.rounds.reduce((sum, r) => sum + r.durationMinutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href="/pipelines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All companies
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{pipeline.company}</h1>
        <p className="text-sm text-muted-foreground">{pipeline.role}</p>
        <p className="mt-2 text-sm text-muted-foreground">{pipeline.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {pipeline.totalRounds} rounds · ~{hours > 0 ? `${hours}h ` : ''}{minutes > 0 ? `${minutes}m` : ''} total
        </p>
      </div>

      {/* Round list */}
      <div>
        <h2 className="mb-3 text-sm font-medium">Interview rounds</h2>
        <div className="space-y-2">
          {pipeline.rounds.map((round, i) => (
            <RoundCard key={round.id} round={round} index={i} />
          ))}
        </div>
      </div>

      {/* Start section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Ready to start your {pipeline.company} interview?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">
              Job description (optional — helps tailor questions)
            </label>
            <Textarea
              placeholder={`Paste the ${pipeline.company} ${pipeline.role} job description here...`}
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="resize-none text-sm"
            />
          </div>
          <Button className="w-full" onClick={handleStart} disabled={starting}>
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting pipeline...
              </>
            ) : (
              'Start Pipeline'
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You&apos;ll progress through each round. Pass to advance, fail to retry.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
