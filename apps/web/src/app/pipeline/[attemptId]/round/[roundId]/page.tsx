'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { AiChat, type AiChatHandle } from '@/components/ai-chat'
import { useCodeDebounce } from '@/hooks/use-code-debounce'
import { toast } from 'sonner'
import { Loader2, Timer, ChevronDown, ChevronUp, Zap, ArrowLeft } from 'lucide-react'

const CodeEditor = dynamic(
  () => import('@/components/code-editor').then((m) => ({ default: m.CodeEditor })),
  { ssr: false, loading: () => <Skeleton className="h-full w-full bg-[#0F1219]" /> },
)

type Language = 'python' | 'javascript' | 'java' | 'cpp' | 'go'

interface Question {
  id: string
  content: string
  type: string
  difficulty: string
  orderIndex: number
  metadata?: {
    title?: string
    starterCode?: Record<string, string>
    testCases?: Array<{ input: string; expected: string }>
  } | null
}

interface RoundInfo {
  name: string
  roundType: string
  durationMinutes: number
  questionCount: number
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-[#22C55E]/15 text-[#4ADE80]',
  medium: 'bg-[#F59E0B]/15 text-[#FCD34D]',
  hard: 'bg-[#EF4444]/15 text-[#F87171]',
}

function useTimer(durationMinutes: number) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isWarning = secondsLeft < 300

  return {
    label: `${mins}:${secs.toString().padStart(2, '0')}`,
    isWarning,
  }
}

export default function ActiveRoundPage() {
  const { attemptId, roundId } = useParams<{ attemptId: string; roundId: string }>()
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null)
  const [company, setCompany] = useState('Google')
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showTestCases, setShowTestCases] = useState(false)

  const codeRef = useRef('')
  const aiChatRef = useRef<AiChatHandle>(null)

  useEffect(() => {
    codeRef.current = code
  }, [code])

  const currentQuestion = questions[currentQIndex]
  const isDsaRound =
    roundInfo?.roundType === 'coding' ||
    roundInfo?.roundType === 'oa' ||
    roundInfo?.roundType === 'phone_screen'
  const isBehavioralRound = roundInfo?.roundType === 'behavioral'

  const { label: timerLabel, isWarning } = useTimer(roundInfo?.durationMinutes || 45)

  const handleAiTrigger = useCallback((newCode: string) => {
    codeRef.current = newCode
    aiChatRef.current?.triggerCodeUpdate()
  }, [])
  const { handleCodeChange } = useCodeDebounce(handleAiTrigger)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) {
      router.push('/auth/login')
      return
    }

    api.pipelines
      .getAttempt(token, attemptId)
      .then((data) => {
        setCompany(data.pipeline.company)

        const round = data.rounds.find((r: any) => r.session?.id === roundId)
        if (round) {
          setRoundInfo({
            name: round.name,
            roundType: round.roundType,
            durationMinutes: round.durationMinutes,
            questionCount: round.questionCount,
          })

          if (round.session?.status === 'in_progress') {
            setStarted(true)
            return api.pipelines.getRoundQuestions(token, roundId)
          }
        }
        return null
      })
      .then((qData) => {
        if (qData?.questions) {
          setQuestions(qData.questions)
          const firstQ = qData.questions[0]
          if (firstQ?.metadata?.starterCode?.[language]) {
            setCode(firstQ.metadata.starterCode[language])
          }
        }
      })
      .catch(() => toast.error('Failed to load round'))
      .finally(() => setLoading(false))
  }, [token, _hasHydrated, attemptId, roundId, router, language])

  const handleStartRound = async () => {
    if (!token) return
    setStarting(true)
    try {
      const result = await api.pipelines.startRound(token, roundId)
      setQuestions(result.questions || [])
      setStarted(true)
      const firstQ = result.questions?.[0]
      if (firstQ?.metadata?.starterCode?.[language]) {
        setCode(firstQ.metadata.starterCode[language])
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start round')
    } finally {
      setStarting(false)
    }
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    const starterCode = currentQuestion?.metadata?.starterCode?.[lang]
    if (starterCode) setCode(starterCode)
  }

  const handleSubmit = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      if (isDsaRound && questions.length > 0) {
        for (const q of questions) {
          const qCode = answers[q.id] || (q.id === currentQuestion?.id ? code : '')
          if (!qCode.trim()) continue
          await api.evaluations.submit(token, {
            questionId: q.id,
            interviewId: `pipeline-${attemptId}`,
            answer: 'See code submission',
            codeAnswer: qCode,
            language,
          })
        }
      } else if (isBehavioralRound && questions.length > 0) {
        for (const q of questions) {
          const ans = answers[q.id]
          if (!ans?.trim()) continue
          await api.evaluations.submit(token, {
            questionId: q.id,
            interviewId: `pipeline-${attemptId}`,
            answer: ans,
          })
        }
      }

      const result = await api.pipelines.completeRound(token, roundId)
      if (result.passed) {
        toast.success(`Round passed! Score: ${result.score}/10`)
      } else {
        toast.error(`Round not passed. Score: ${result.score}/10`)
      }
      router.push(`/pipeline/${attemptId}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (!_hasHydrated || !token) return null

  if (loading) {
    return (
      <div className="flex h-screen gap-0 bg-[#0D0F14]">
        <Skeleton className="flex-1 rounded-none bg-[#0F1219]" />
        <Skeleton className="w-80 rounded-none bg-[#141720]" />
      </div>
    )
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0D0F14] text-center px-6">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between border-b border-[#1E2535] px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB]">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">PrepAI</span>
          </div>
          <Link href={`/pipeline/${attemptId}`} className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Exit
          </Link>
        </div>

        <div className="max-w-md space-y-6">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${
              isDsaRound
                ? 'bg-[#10B981]/15 text-[#6EE7B7]'
                : 'bg-[#F97316]/15 text-[#FDBA74]'
            }`}
          >
            {isDsaRound ? 'Coding Round' : roundInfo?.roundType === 'behavioral' ? 'Behavioral Round' : roundInfo?.roundType}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{roundInfo?.name}</h1>
            <p className="mt-2 text-sm text-[#94A3B8]">
              {roundInfo?.durationMinutes} min · {roundInfo?.questionCount}{' '}
              {roundInfo?.questionCount === 1 ? 'question' : 'questions'}
            </p>
          </div>
          <p className="text-sm text-[#64748B] leading-relaxed">
            {isDsaRound
              ? 'You\'ll have an AI interviewer helping you through the problem. Think aloud and communicate your approach.'
              : 'Answer the questions clearly and concisely using the STAR method where appropriate.'}
          </p>
          <Button
            onClick={handleStartRound}
            disabled={starting}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-8 py-2.5"
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading questions...
              </>
            ) : (
              'Start Round →'
            )}
          </Button>
        </div>
      </div>
    )
  }

  // DSA / Coding round — IDE layout
  if (isDsaRound && currentQuestion) {
    const testCases = currentQuestion.metadata?.testCases || []

    return (
      <div className="flex h-screen overflow-hidden bg-[#0D0F14]">
        {/* Left panel */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-[#1E2535]">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-[#1E2535] bg-[#141720] px-4 h-12">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#2563EB]">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span className="text-white font-medium">{company}</span>
                <span>·</span>
                <span>{roundInfo?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {questions.length > 1 && (
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: code }))
                        setCurrentQIndex(i)
                        const q = questions[i]
                        const starter = q.metadata?.starterCode?.[language]
                        setCode(starter || answers[q.id] || '')
                      }}
                      className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                        i === currentQIndex
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#1C2235] text-[#94A3B8] hover:bg-[#1E2535]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
              {/* Timer */}
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-semibold ${
                  isWarning
                    ? 'bg-[#EF4444]/15 text-[#F87171]'
                    : 'bg-[#1C2235] text-[#94A3B8]'
                }`}
              >
                <Timer className="h-3 w-3" />
                {timerLabel}
              </span>
            </div>
          </div>

          {/* Problem description */}
          <div className="flex-shrink-0 max-h-[40%] overflow-y-auto p-5 border-b border-[#1E2535] bg-[#0D0F14]">
            <div className="flex items-center gap-2.5 mb-3">
              <h2 className="text-base font-bold text-white">
                {currentQuestion.metadata?.title || `Problem ${currentQIndex + 1}`}
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                  DIFFICULTY_STYLES[currentQuestion.difficulty] || DIFFICULTY_STYLES.medium
                }`}
              >
                {currentQuestion.difficulty}
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap">
              {currentQuestion.content}
            </p>

            {testCases.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
                  onClick={() => setShowTestCases(!showTestCases)}
                >
                  {showTestCases ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Test cases ({testCases.length})
                </button>
                {showTestCases && (
                  <div className="mt-2 space-y-2">
                    {testCases.map((tc, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-[#0F1219] border border-[#1E2535] p-3 font-mono text-xs"
                      >
                        <div className="text-[#64748B]">
                          <span className="text-[#94A3B8]">Input:</span> {tc.input}
                        </div>
                        <div className="text-[#64748B] mt-0.5">
                          <span className="text-[#94A3B8]">Expected:</span> {tc.expected}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Code editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1E2535] bg-[#141720] px-3 py-1.5">
              <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
                <SelectTrigger className="h-7 w-36 text-xs bg-transparent border-[#1E2535] text-[#94A3B8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E2640] border-[#1E2535] text-white">
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                value={code}
                onChange={(v) => {
                  setCode(v)
                  handleCodeChange(v)
                }}
                language={language}
              />
            </div>
          </div>

          {/* Submit bar */}
          <div className="border-t border-[#1E2535] bg-[#141720] px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#94A3B8] hover:text-white hover:bg-[#1C2235]"
              asChild
            >
              <Link href={`/pipeline/${attemptId}`}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Exit round
              </Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                'Submit Solution'
              )}
            </Button>
          </div>
        </div>

        {/* Right panel: AI Chat */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden bg-[#141720]">
          <AiChat
            ref={aiChatRef}
            roundSessionId={roundId}
            token={token}
            codeRef={codeRef}
            company={company}
            maxInteractions={20}
            disabled={submitting}
          />
        </div>
      </div>
    )
  }

  // Behavioral round
  return (
    <div className="flex h-screen flex-col bg-[#0D0F14]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#1E2535] bg-[#141720] px-6 h-14">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB]">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">PrepAI</span>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-white">{roundInfo?.name}</p>
          <p className="text-[11px] text-[#64748B]">
            Question {currentQIndex + 1} of {questions.length}
          </p>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-mono font-semibold ${
            isWarning ? 'bg-[#EF4444]/15 text-[#F87171]' : 'bg-[#1C2235] text-[#94A3B8]'
          }`}
        >
          <Timer className="h-3 w-3" />
          {timerLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
          {/* Question label */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA]">
            Question {currentQIndex + 1} of {questions.length} · {roundInfo?.roundType === 'behavioral' ? 'Behavioral' : 'Interview'}
          </p>

          {/* Question card */}
          <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
            <p className="text-base leading-relaxed text-white">
              {currentQuestion?.content}
            </p>
          </div>

          {/* Answer textarea */}
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2">Your Answer</label>
            <textarea
              className="w-full rounded-xl border border-[#1E2535] bg-[#0F1219] p-4 text-sm text-white placeholder:text-[#334155] resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors"
              rows={10}
              placeholder="Type your answer here... Use STAR method: Situation, Task, Action, Result."
              value={currentQuestion ? (answers[currentQuestion.id] || '') : ''}
              onChange={(e) =>
                currentQuestion &&
                setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
              }
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {currentQIndex > 0 ? (
              <Button
                variant="outline"
                className="border-[#1E2535] text-[#94A3B8] hover:bg-[#1C2235] hover:text-white"
                onClick={() => setCurrentQIndex((i) => i - 1)}
              >
                Previous
              </Button>
            ) : (
              <div />
            )}
            {currentQIndex < questions.length - 1 ? (
              <Button
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
                onClick={() => setCurrentQIndex((i) => i + 1)}
              >
                Next Question
              </Button>
            ) : (
              <Button
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Round'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
