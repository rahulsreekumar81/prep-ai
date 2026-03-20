'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ArrowLeft, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'

interface QuestionResult {
  question: {
    id: string
    content: string
    type: string
    difficulty: string
    orderIndex: number
    metadata?: { title?: string } | null
  }
  evaluation: {
    userAnswer: string
    codeAnswer?: string | null
    language?: string | null
    relevanceScore: number
    depthScore: number
    clarityScore: number
    structureScore: number
    overallScore: number
    feedback: string
    sampleAnswer: string
    tips: string[]
  } | null
}

interface SummaryData {
  interviewId: string
  totalQuestions: number
  answeredQuestions: number
  averageScore: number
  results: QuestionResult[]
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? '#22C55E' : score >= 5 ? '#F59E0B' : '#EF4444'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize text-[#94A3B8]">{label}</span>
        <span className="font-semibold text-white">{score}/10</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#1E2535] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score * 10}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function QuestionCard({ item, index }: { item: QuestionResult; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const eval_ = item.evaluation
  const isDsa = item.question.type === 'dsa'
  const score = eval_?.overallScore

  return (
    <div className="rounded-xl border border-[#1E2535] bg-[#161B26] overflow-hidden">
      <button
        type="button"
        className="w-full text-left px-5 py-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#64748B]">Q{index + 1}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                isDsa ? 'bg-[#10B981]/15 text-[#6EE7B7]' : 'bg-[#F97316]/15 text-[#FDBA74]'
              }`}
            >
              {isDsa ? 'DSA Coding' : item.question.type.replace('_', ' ')}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                item.question.difficulty === 'easy'
                  ? 'bg-[#22C55E]/15 text-[#4ADE80]'
                  : item.question.difficulty === 'hard'
                  ? 'bg-[#EF4444]/15 text-[#F87171]'
                  : 'bg-[#F59E0B]/15 text-[#FCD34D]'
              }`}
            >
              {item.question.difficulty}
            </span>
            {isDsa && item.question.metadata?.title && (
              <span className="text-sm font-semibold text-white">{item.question.metadata.title}</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {score != null ? (
              <span className={`text-sm font-bold ${score >= 7 ? 'text-[#4ADE80]' : score >= 5 ? 'text-[#FCD34D]' : 'text-[#F87171]'}`}>
                {score}/10
              </span>
            ) : (
              <span className="text-xs text-[#64748B]">Skipped</span>
            )}
            {expanded
              ? <ChevronUp className="h-4 w-4 text-[#64748B]" />
              : <ChevronDown className="h-4 w-4 text-[#64748B]" />
            }
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#1E2535] px-5 py-4 space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#94A3B8]">
            {item.question.content}
          </p>

          {eval_ ? (
            <>
              {isDsa && eval_.codeAnswer && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-[#64748B]">Your code</p>
                    {eval_.language && (
                      <span className="rounded-full border border-[#1E2535] px-2 py-0.5 text-[10px] text-[#94A3B8]">
                        {eval_.language}
                      </span>
                    )}
                  </div>
                  <pre className="overflow-x-auto rounded-xl bg-[#0F1219] border border-[#151C2E] p-3 text-xs text-[#94A3B8] font-mono">
                    <code>{eval_.codeAnswer}</code>
                  </pre>
                </div>
              )}

              {(!isDsa || (eval_.userAnswer && eval_.userAnswer !== 'See code submission')) && (
                <div>
                  <p className="text-xs font-semibold text-[#64748B] mb-1.5">
                    {isDsa ? 'Your explanation' : 'Your answer'}
                  </p>
                  <p className="text-sm leading-relaxed text-[#94A3B8]">{eval_.userAnswer}</p>
                </div>
              )}

              <div className="space-y-2">
                {isDsa ? (
                  <>
                    <ScoreBar label="Correctness" score={eval_.relevanceScore} />
                    <ScoreBar label="Efficiency" score={eval_.depthScore} />
                    <ScoreBar label="Code Quality" score={eval_.clarityScore} />
                    <ScoreBar label="Edge Cases" score={eval_.structureScore} />
                  </>
                ) : (
                  <>
                    <ScoreBar label="Relevance" score={eval_.relevanceScore} />
                    <ScoreBar label="Depth" score={eval_.depthScore} />
                    <ScoreBar label="Clarity" score={eval_.clarityScore} />
                    <ScoreBar label="Structure" score={eval_.structureScore} />
                  </>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-[#64748B] mb-1.5">Feedback</p>
                <p className="text-sm leading-relaxed text-[#94A3B8]">{eval_.feedback}</p>
              </div>

              {eval_.tips && eval_.tips.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#64748B] mb-1.5">Tips</p>
                  <ul className="space-y-1">
                    {eval_.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#94A3B8]">
                        <span className="mt-0.5 text-[#60A5FA] flex-shrink-0">·</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[#64748B] mb-1.5">
                  {isDsa ? 'Optimized solution' : 'Sample answer'}
                </p>
                {isDsa ? (
                  <pre className="overflow-x-auto rounded-xl bg-[#0F1219] border border-[#151C2E] p-3 text-xs text-[#94A3B8] font-mono">
                    <code>{eval_.sampleAnswer}</code>
                  </pre>
                ) : (
                  <p className="text-sm leading-relaxed text-[#94A3B8]">{eval_.sampleAnswer}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#64748B]">No answer submitted for this question.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function InterviewResultPage() {
  const { id } = useParams<{ id: string }>()
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) { router.push('/auth/login'); return }
    api.evaluations
      .getSummary(token, id)
      .then(setData)
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [token, id, router, _hasHydrated])

  if (!_hasHydrated || !token) return null

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 bg-[#1E2535]" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 bg-[#1E2535]" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-[#64748B]">Could not load interview results.</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA] mb-1">
            Interview Results
          </p>
          <h1 className="text-2xl font-bold text-white">Performance Summary</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {data.answeredQuestions} of {data.totalQuestions} questions answered
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[#1E2535] text-[#94A3B8] hover:bg-[#1C2235] hover:text-white"
          asChild
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B]">Avg Score</p>
            <BarChart3 className="h-4 w-4 text-[#64748B]" />
          </div>
          <p className={`text-3xl font-bold ${data.averageScore >= 7 ? 'text-[#4ADE80]' : data.averageScore >= 5 ? 'text-[#FCD34D]' : 'text-[#F87171]'}`}>
            {data.averageScore}/10
          </p>
        </div>
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-3">Answered</p>
          <p className="text-3xl font-bold text-white">{data.answeredQuestions}/{data.totalQuestions}</p>
        </div>
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-3">Completion</p>
          <p className="text-3xl font-bold text-white">
            {data.totalQuestions > 0
              ? Math.round((data.answeredQuestions / data.totalQuestions) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Question breakdown */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-4">
          Question Breakdown
        </p>
        <div className="space-y-2">
          {data.results.map((item, i) => (
            <QuestionCard key={item.question.id} item={item} index={i} />
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
        asChild
      >
        <Link href="/interview/new">Start New Interview →</Link>
      </Button>
    </div>
  )
}
