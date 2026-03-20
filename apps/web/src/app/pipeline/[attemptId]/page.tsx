'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  Lock,
  Circle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react'

interface RoundWithSession {
  id: string
  name: string
  roundType: string
  orderIndex: number
  durationMinutes: number
  questionCount: number
  description: string
  passingScore: number
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
    pipelineId: string
    startedAt: string
  }
  pipeline: {
    company: string
    role: string
    totalRounds: number
  }
  rounds: RoundWithSession[]
}

const ROUND_TYPE_LABELS: Record<string, string> = {
  oa: 'OA',
  coding: 'Coding',
  phone_screen: 'Phone Screen',
  system_design: 'System Design',
  behavioral: 'Behavioral',
  mixed: 'Mixed',
}

const ROUND_TYPE_COLORS: Record<string, string> = {
  oa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  coding: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  phone_screen: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  system_design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  behavioral: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  mixed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

function RoundRow({
  round,
  isCurrent,
  attemptId,
}: {
  round: RoundWithSession
  isCurrent: boolean
  attemptId: string
}) {
  const [showFeedback, setShowFeedback] = useState(false)
  const session = round.session
  const status = session?.status || 'pending'

  const isPassed = status === 'passed'
  const isFailed = status === 'failed'
  const isInProgress = status === 'in_progress'
  const isLocked = status === 'pending' && !isCurrent

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isCurrent ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20' : ''
      } ${isLocked ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Status icon */}
        <div className="flex-shrink-0">
          {isPassed && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          {isFailed && <XCircle className="h-6 w-6 text-red-500" />}
          {isCurrent && !isPassed && !isFailed && (
            <div className="h-6 w-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
          )}
          {isInProgress && !isCurrent && <Circle className="h-6 w-6 text-blue-400" />}
          {isLocked && <Lock className="h-6 w-6 text-muted-foreground" />}
        </div>

        {/* Round info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{round.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                ROUND_TYPE_COLORS[round.roundType] || ROUND_TYPE_COLORS.mixed
              }`}
            >
              {ROUND_TYPE_LABELS[round.roundType] || round.roundType}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {round.durationMinutes} min · {round.questionCount}{' '}
            {round.questionCount === 1 ? 'question' : 'questions'}
          </p>
          {(isPassed || isFailed) && session?.score != null && (
            <p className={`mt-0.5 text-sm font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {session.score}/10 · {isPassed ? 'Passed' : 'Failed'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isCurrent && session && (
            <Button size="sm" asChild>
              <Link href={`/pipeline/${attemptId}/round/${session.id}`}>
                <Play className="mr-1 h-3 w-3" />
                {isInProgress ? 'Continue' : 'Start Round'}
              </Link>
            </Button>
          )}
          {(isPassed || isFailed) && session?.feedback && (
            <button
              type="button"
              className="text-xs text-muted-foreground"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              {showFeedback ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          {isLocked && (
            <span className="text-xs text-muted-foreground">Locked</span>
          )}
        </div>
      </div>

      {showFeedback && session?.feedback && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">{session.feedback}</p>
        </div>
      )}
    </div>
  )
}

export default function PipelineOverviewPage() {
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
      .catch(() => toast.error('Failed to load pipeline'))
      .finally(() => setLoading(false))
  }, [token, _hasHydrated, attemptId, router])

  if (!_hasHydrated || !token) return null

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Could not load pipeline attempt.</p>
  }

  const { attempt, pipeline, rounds } = data
  const passedRounds = rounds.filter((r) => r.session?.status === 'passed').length
  const currentRound = rounds[attempt.currentRoundIndex]
  const progressPct = (passedRounds / pipeline.totalRounds) * 100
  const isPipelineDone = attempt.status === 'passed' || attempt.status === 'failed'

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href="/pipelines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All pipelines
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {pipeline.company} — {pipeline.role}
        </h1>
        <p className="text-sm text-muted-foreground">
          Round {Math.min(passedRounds + 1, pipeline.totalRounds)} of {pipeline.totalRounds}
        </p>
        <Progress value={progressPct} className="mt-3 h-2" />
      </div>

      {isPipelineDone && (
        <Card
          className={`border ${
            attempt.status === 'passed'
              ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20'
              : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
          }`}
        >
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className={`font-semibold ${attempt.status === 'passed' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {attempt.status === 'passed' ? 'Pipeline Complete — All rounds passed!' : 'Pipeline ended — a round was not passed'}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/pipeline/${attemptId}/result`}>View Results</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {rounds.map((round, i) => (
          <RoundRow
            key={round.id}
            round={round}
            isCurrent={i === attempt.currentRoundIndex && !isPipelineDone}
            attemptId={attemptId}
          />
        ))}
      </div>
    </div>
  )
}
