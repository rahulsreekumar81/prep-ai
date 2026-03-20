'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, XCircle, BarChart3, Clock, Trophy } from 'lucide-react'

interface RoundResult {
  id: string
  name: string
  roundType: string
  durationMinutes: number
  session: {
    id: string
    status: string
    score: number | null
    feedback: string | null
  } | null
}

interface AttemptData {
  attempt: {
    id: string
    status: string
    currentRoundIndex: number
    startedAt: string
    completedAt: string | null
  }
  pipeline: {
    company: string
    role: string
    totalRounds: number
  }
  rounds: RoundResult[]
}

const ROUND_TYPE_LABELS: Record<string, string> = {
  oa: 'OA',
  coding: 'Coding',
  phone_screen: 'Phone Screen',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  mixed: 'Mixed',
}

export default function PipelineResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<AttemptData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) {
      router.push('/auth/login')
      return
    }
    api.pipelines
      .getAttempt(token, attemptId)
      .then(setData)
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [token, _hasHydrated, attemptId, router])

  if (!_hasHydrated || !token) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Could not load results.</p>
  }

  const { attempt, pipeline, rounds } = data
  const isPassed = attempt.status === 'passed'
  const passedRounds = rounds.filter((r) => r.session?.status === 'passed').length
  const completedRounds = rounds.filter((r) => r.session?.score != null)
  const avgScore =
    completedRounds.length > 0
      ? completedRounds.reduce((sum, r) => sum + (r.session?.score || 0), 0) / completedRounds.length
      : 0

  const durationMs = attempt.completedAt
    ? new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()
    : null
  const durationLabel = durationMs
    ? `${Math.floor(durationMs / 3600000)}h ${Math.floor((durationMs % 3600000) / 60000)}m`
    : '—'

  const scoreColor =
    avgScore >= 7 ? 'text-green-600' : avgScore >= 5 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href={`/pipeline/${attemptId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to pipeline
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {pipeline.company} — {pipeline.role}
        </h1>
        <div className="mt-2">
          {isPassed ? (
            <div className="flex items-center gap-2 text-green-600">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">All rounds passed!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Pipeline not completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Score
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${scoreColor}`}>
              {Math.round(avgScore * 10) / 10}/10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rounds Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {passedRounds}/{pipeline.totalRounds}
            </p>
            <Progress
              value={(passedRounds / pipeline.totalRounds) * 100}
              className="mt-2 h-1.5"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Spent
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{durationLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Round breakdown */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Round breakdown</h2>
        <div className="space-y-2">
          {rounds.map((round) => {
            const status = round.session?.status
            const isPassed = status === 'passed'
            const isFailed = status === 'failed'
            const isSkipped = !status || status === 'pending'

            return (
              <div key={round.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isPassed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {isFailed && <XCircle className="h-5 w-5 text-red-500" />}
                    {isSkipped && <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium">{round.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {ROUND_TYPE_LABELS[round.roundType] || round.roundType} · {round.durationMinutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {round.session?.score != null && (
                      <span className={`text-sm font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {round.session.score}/10
                      </span>
                    )}
                    {isPassed && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Passed
                      </Badge>
                    )}
                    {isFailed && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                    {isSkipped && (
                      <Badge variant="secondary">Not reached</Badge>
                    )}
                  </div>
                </div>
                {round.session?.feedback && (
                  <p className="mt-2 text-xs text-muted-foreground pl-8">{round.session.feedback}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href={`/pipelines/${encodeURIComponent(pipeline.company)}`}>
            Retry Pipeline
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/pipelines">Try Another Company</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
