'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { ArrowLeft, Clock, Loader2, CheckCircle2 } from 'lucide-react'

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

export default function PipelineDetailPage() {
  const { company } = useParams<{ company: string }>()
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()

  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [jobDescription, setJobDescription] = useState('')

  const decodedCompany = decodeURIComponent(company)
  const colorClass = COMPANY_COLORS[decodedCompany] || 'bg-[#2563EB]'

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
        <Skeleton className="h-8 w-48 bg-[#1E2535]" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-[#1E2535]" />
          ))}
        </div>
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="space-y-4">
        <Link href="/pipelines" className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All companies
        </Link>
        <p className="text-sm text-[#64748B]">Pipeline not found for {decodedCompany}.</p>
      </div>
    )
  }

  const totalMinutes = pipeline.rounds.reduce((sum, r) => sum + r.durationMinutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/pipelines"
        className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All companies
      </Link>

      {/* Company header */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl ${colorClass} text-xl font-bold text-white shadow-xl`}
        >
          {pipeline.company[0]}
        </div>
        <div>
          <h1 className="text-[28px] font-bold text-white">{pipeline.company}</h1>
          <p className="text-sm text-[#94A3B8]">{pipeline.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#64748B]">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {hours > 0 ? `~${hours}h ${mins > 0 ? `${mins}m` : ''}` : `~${mins}m`} total
        </span>
        <span>·</span>
        <span>{pipeline.totalRounds} rounds</span>
      </div>

      {/* Process roadmap */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-4">
          Process Roadmap
        </p>

        {/* Horizontal stepper */}
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {pipeline.rounds.map((round, i) => (
            <div key={round.id} className="flex items-start">
              <div className="flex flex-col items-center">
                {/* Step node */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#2563EB] bg-[#172554] text-xs font-bold text-[#60A5FA]">
                  {i + 1}
                </div>
                {/* Round info below node */}
                <div className="mt-2 w-24 text-center">
                  <p className="text-[11px] font-semibold text-white leading-tight">{round.name}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${BADGE_STYLES[round.roundType] || BADGE_STYLES.mixed}`}
                  >
                    {ROUND_TYPE_LABELS[round.roundType] || round.roundType}
                  </span>
                  <p className="mt-1 text-[10px] text-[#64748B]">{round.durationMinutes}m</p>
                </div>
              </div>
              {/* Connector line */}
              {i < pipeline.rounds.length - 1 && (
                <div className="mt-3.5 h-0.5 w-6 flex-shrink-0 bg-[#1E3A5F]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Round detail cards */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] mb-4">
          Round Requirements
        </p>
        <div className="space-y-2">
          {pipeline.rounds.map((round, i) => (
            <div
              key={round.id}
              className="rounded-xl border border-[#1E2535] bg-[#161B26] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#172554] text-[11px] font-bold text-[#60A5FA]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{round.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_STYLES[round.roundType] || BADGE_STYLES.mixed}`}
                    >
                      {ROUND_TYPE_LABELS[round.roundType] || round.roundType}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {round.durationMinutes} min
                    </span>
                    <span>{round.questionCount} {round.questionCount === 1 ? 'question' : 'questions'}</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
                      Pass: {round.passingScore}/10
                    </span>
                  </div>
                  {round.description && (
                    <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">{round.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready to Begin CTA */}
      <div className="rounded-2xl border border-[#2563EB]/30 bg-gradient-to-br from-[#172554]/60 to-[#161B26] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA] mb-1">Ready to Begin?</p>
        <h2 className="text-lg font-bold text-white mb-1">Start your {pipeline.company} interview</h2>
        <p className="text-sm text-[#94A3B8] mb-4">{pipeline.description}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Job description <span className="text-[#64748B]">(optional — helps tailor questions)</span>
            </label>
            <Textarea
              placeholder={`Paste the ${pipeline.company} ${pipeline.role} JD here...`}
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="resize-none bg-[#0F1219] border-[#1E2535] text-sm text-white placeholder:text-[#334155] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <Button
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5 rounded-[8px]"
            onClick={handleStart}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting pipeline...
              </>
            ) : (
              'Start Pipeline →'
            )}
          </Button>

          <p className="text-[11px] text-center text-[#64748B]">
            Progress through each round. Pass to advance, fail to retry.
          </p>
        </div>
      </div>
    </div>
  )
}
