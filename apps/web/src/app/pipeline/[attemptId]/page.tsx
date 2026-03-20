'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Lock, ArrowLeft, Play, ChevronDown, ChevronUp, Clock } from 'lucide-react'

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

const BADGE_STYLES: Record<string, string> = {
  oa: 'bg-[#3B82F6]/15 text-[#93C5FD]',
  coding: 'bg-[#10B981]/15 text-[#6EE7B7]',
  phone_screen: 'bg-[#06B6D4]/15 text-[#67E8F9]',
  system_design: 'bg-[#8B5CF6]/15 text-[#C4B5FD]',
  behavioral: 'bg-[#F97316]/15 text-[#FDBA74]',
  mixed: 'bg-[#64748B]/15 text-[#94A3B8]',
}

function RoundRow({
  round,
  isCurrent,
  attemptId,
  index,
}: {
  round: RoundWithSession
  isCurrent: boolean
  attemptId: string
  index: number
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
      className={`rounded-xl border p-4 transition-all ${
        isCurrent
          ? 'border-[#2563EB]/50 bg-[#172554]/30 shadow-[0_0_16px_rgba(37,99,235,0.1)]'
          : isPassed
          ? 'border-[#22C55E]/30 bg-[#14532D]/10'
          : isFailed
          ? 'border-[#EF4444]/30 bg-[#450A0A]/20'
          : 'border-[#1E2535] bg-[#161B26]'
      } ${isLocked ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Status icon */}
        <div className="flex-shrink-0">
          {isPassed && <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />}
          {isFailed && <XCircle className="h-5 w-5 text-[#EF4444]" />}
          {isCurrent && !isPassed && !isFailed && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#2563EB]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            </div>
          )}
          {isInProgress && !isCurrent && (
            <div className="h-5 w-5 rounded-full border-2 border-[#60A5FA]" />
          )}
          {isLocked && <Lock className="h-4 w-4 text-[#334155]" />}
        </div>

        {/* Step number */}
        <span className="flex-shrink-0 text-xs font-bold text-[#64748B] w-4">{index + 1}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isLocked ? 'text-[#334155]' : 'text-white'}`}>
              {round.name}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_STYLES[round.roundType] || BADGE_STYLES.mixed}`}>
              {ROUND_TYPE_LABELS[round.roundType] || round.roundType}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {round.durationMinutes} min
            </span>
            <span>{round.questionCount} {round.questionCount === 1 ? 'question' : 'questions'}</span>
          </div>
          {(isPassed || isFailed) && session?.score != null && (
            <p className={`mt-1 text-sm font-semibold ${isPassed ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
              {session.score}/10 · {isPassed ? 'Passed' : 'Failed'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {isCurrent && session && (
            <Button
              size="sm"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs px-3 h-8"
              asChild
            >
              <Link href={`/pipeline/${attemptId}/round/${session.id}`}>
                <Play className="mr-1 h-3 w-3" />
                {isInProgress ? 'Continue' : 'Start Round'}
              </Link>
            </Button>
          )}
          {(isPassed || isFailed) && session?.feedback && (
            <button
              type="button"
              className="text-[#64748B] hover:text-white transition-colors"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              {showFeedback ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          {isLocked && (
            <span className="text-[11px] text-[#334155] font-medium">Locked</span>
          )}
        </div>
      </div>

      {showFeedback && session?.feedback && (
        <div className="mt-3 pt-3 border-t border-[#1E2535]">
          <p className="text-xs text-[#94A3B8] leading-relaxed">{session.feedback}</p>
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
        <Skeleton className="h-8 w-48 bg-[#1E2535]" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-20 bg-[#1E2535]" />
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-[#64748B]">Could not load pipeline attempt.</p>
  }

  const { attempt, pipeline, rounds } = data
  const passedRounds = rounds.filter((r) => r.session?.status === 'passed').length
  const isPipelineDone = attempt.status === 'passed' || attempt.status === 'failed'

  return (
    <div className="flex gap-8">
      {/* Left — stepper */}
      <div className="flex-1 min-w-0 space-y-4">
        <div>
          <Link
            href="/pipelines"
            className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> All pipelines
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA]">
            Pipeline Detail
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {pipeline.company} — {pipeline.role}
          </h1>
        </div>

        {/* Pipeline done banner */}
        {isPipelineDone && (
          <div
            className={`rounded-xl border p-4 flex items-center justify-between ${
              attempt.status === 'passed'
                ? 'border-[#22C55E]/40 bg-[#14532D]/20'
                : 'border-[#EF4444]/40 bg-[#450A0A]/20'
            }`}
          >
            <div>
              <p className={`text-sm font-semibold ${attempt.status === 'passed' ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                {attempt.status === 'passed'
                  ? 'Pipeline Complete — All rounds passed!'
                  : 'Pipeline ended — a round was not passed'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-[#1E2535] text-white hover:bg-[#1C2235]"
              asChild
            >
              <Link href={`/pipeline/${attemptId}/result`}>View Results</Link>
            </Button>
          </div>
        )}

        {/* Round list */}
        <div className="space-y-2">
          {rounds.map((round, i) => (
            <RoundRow
              key={round.id}
              round={round}
              isCurrent={i === attempt.currentRoundIndex && !isPipelineDone}
              attemptId={attemptId}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Right — stats sidebar */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-4">Progress</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#94A3B8]">Rounds passed</span>
                <span className="font-semibold text-white">{passedRounds}/{pipeline.totalRounds}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#1E2535] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2563EB] transition-all"
                  style={{ width: `${(passedRounds / pipeline.totalRounds) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E2535] space-y-2">
              {rounds.map((r, i) => {
                const s = r.session?.status || 'pending'
                return (
                  <div key={r.id} className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        s === 'passed'
                          ? 'bg-[#22C55E]'
                          : s === 'failed'
                          ? 'bg-[#EF4444]'
                          : s === 'in_progress'
                          ? 'bg-[#2563EB] animate-pulse'
                          : 'bg-[#334155]'
                      }`}
                    />
                    <span className={`text-xs truncate ${s === 'pending' && i !== attempt.currentRoundIndex ? 'text-[#334155]' : 'text-[#94A3B8]'}`}>
                      {r.name}
                    </span>
                    {r.session?.score != null && (
                      <span className={`ml-auto text-xs font-semibold flex-shrink-0 ${s === 'passed' ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                        {r.session.score}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-3">Status</p>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              attempt.status === 'passed'
                ? 'bg-[#22C55E]/15 text-[#4ADE80]'
                : attempt.status === 'failed'
                ? 'bg-[#EF4444]/15 text-[#F87171]'
                : 'bg-[#2563EB]/15 text-[#60A5FA]'
            }`}
          >
            {attempt.status === 'in_progress'
              ? 'In Progress'
              : attempt.status === 'passed'
              ? 'Passed'
              : attempt.status === 'failed'
              ? 'Failed'
              : attempt.status}
          </span>
          <p className="mt-3 text-xs text-[#64748B]">
            Started {new Date(attempt.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}
