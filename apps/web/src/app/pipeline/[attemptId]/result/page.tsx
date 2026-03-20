'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Clock, BarChart3 } from 'lucide-react'

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

const BADGE_STYLES: Record<string, string> = {
  oa: 'bg-[#3B82F6]/15 text-[#93C5FD]',
  coding: 'bg-[#10B981]/15 text-[#6EE7B7]',
  phone_screen: 'bg-[#06B6D4]/15 text-[#67E8F9]',
  system_design: 'bg-[#8B5CF6]/15 text-[#C4B5FD]',
  behavioral: 'bg-[#F97316]/15 text-[#FDBA74]',
  mixed: 'bg-[#64748B]/15 text-[#94A3B8]',
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
      <div className="mx-auto max-w-[860px] space-y-6 px-8 py-8">
        <Skeleton className="h-8 w-48 bg-[#1E2535]" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 bg-[#1E2535]" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-[#64748B]">Could not load results.</p>
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

  return (
    <div className="mx-auto max-w-[860px] space-y-8 px-8 py-8">
      {/* Back */}
      <Link
        href={`/pipeline/${attemptId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to pipeline
      </Link>

      {/* Result hero */}
      <div
        className={`rounded-2xl border p-8 ${
          isPassed
            ? 'border-[#22C55E]/30 bg-gradient-to-br from-[#14532D]/30 to-[#161B26]'
            : 'border-[#EF4444]/30 bg-gradient-to-br from-[#450A0A]/30 to-[#161B26]'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                isPassed ? 'bg-[#22C55E]/20 text-[#4ADE80]' : 'bg-[#EF4444]/20 text-[#F87171]'
              }`}
            >
              {isPassed ? <Trophy className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {isPassed ? 'Hired' : 'Try Again'}
            </div>
            <h1 className="mt-3 text-[28px] font-bold text-white">
              {pipeline.company} — {pipeline.role}
            </h1>
            <p className="mt-1 text-sm text-[#94A3B8]">
              {isPassed
                ? 'Congratulations! You passed all rounds of the interview process.'
                : 'You didn\'t pass all rounds this time. Review the feedback and try again.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B]">Overall Score</p>
            <BarChart3 className="h-4 w-4 text-[#64748B]" />
          </div>
          <p className={`text-3xl font-bold ${avgScore >= 7 ? 'text-[#4ADE80]' : avgScore >= 5 ? 'text-[#FCD34D]' : 'text-[#F87171]'}`}>
            {Math.round(avgScore * 10) / 10}/10
          </p>
        </div>
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-3">Rounds Passed</p>
          <p className="text-3xl font-bold text-white">{passedRounds}/{pipeline.totalRounds}</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#1E2535] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2563EB]"
              style={{ width: `${(passedRounds / pipeline.totalRounds) * 100}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B]">Time Spent</p>
            <Clock className="h-4 w-4 text-[#64748B]" />
          </div>
          <p className="text-3xl font-bold text-white">{durationLabel}</p>
        </div>
      </div>

      {/* Round breakdown */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-4">Round Breakdown</p>
        <div className="space-y-2">
          {rounds.map((round) => {
            const status = round.session?.status
            const isRoundPassed = status === 'passed'
            const isRoundFailed = status === 'failed'
            const isSkipped = !status || status === 'pending'

            return (
              <div
                key={round.id}
                className={`rounded-xl border p-4 ${
                  isRoundPassed
                    ? 'border-[#22C55E]/30 bg-[#14532D]/10'
                    : isRoundFailed
                    ? 'border-[#EF4444]/30 bg-[#450A0A]/10'
                    : 'border-[#1E2535] bg-[#161B26] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isRoundPassed && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#22C55E]" />}
                    {isRoundFailed && <XCircle className="h-4 w-4 flex-shrink-0 text-[#EF4444]" />}
                    {isSkipped && <div className="h-4 w-4 rounded-full border-2 border-[#334155] flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold text-white">{round.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${BADGE_STYLES[round.roundType] || BADGE_STYLES.mixed}`}>
                          {ROUND_TYPE_LABELS[round.roundType] || round.roundType}
                        </span>
                        <span className="text-xs text-[#64748B]">{round.durationMinutes} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {round.session?.score != null && (
                      <span className={`text-sm font-bold ${isRoundPassed ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                        {round.session.score}/10
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isRoundPassed
                          ? 'bg-[#22C55E]/15 text-[#4ADE80]'
                          : isRoundFailed
                          ? 'bg-[#EF4444]/15 text-[#F87171]'
                          : 'bg-[#334155]/30 text-[#64748B]'
                      }`}
                    >
                      {isRoundPassed ? 'Passed' : isRoundFailed ? 'Failed' : 'Not reached'}
                    </span>
                  </div>
                </div>
                {round.session?.feedback && (
                  <p className="mt-2.5 pl-7 text-xs text-[#94A3B8] leading-relaxed">{round.session.feedback}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
          asChild
        >
          <Link href={`/pipelines/${encodeURIComponent(pipeline.company)}`}>
            Retry Pipeline
          </Link>
        </Button>
        <Button
          variant="outline"
          className="border-[#1E2535] text-[#94A3B8] hover:bg-[#1C2235] hover:text-white"
          asChild
        >
          <Link href="/pipelines">Try Another Company</Link>
        </Button>
        <Button
          variant="ghost"
          className="text-[#94A3B8] hover:text-white hover:bg-[#1C2235]"
          asChild
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
