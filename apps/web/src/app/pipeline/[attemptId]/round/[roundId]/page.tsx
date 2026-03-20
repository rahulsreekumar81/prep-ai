'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { AiChat } from '@/components/ai-chat'
import { useCodeDebounce } from '@/hooks/use-code-debounce'
import { toast } from 'sonner'
import { Loader2, Timer, ChevronDown, ChevronUp } from 'lucide-react'

const CodeEditor = dynamic(
  () => import('@/components/code-editor').then((m) => ({ default: m.CodeEditor })),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
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

interface AttemptInfo {
  pipelineId: string
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
  const [attemptInfo, setAttemptInfo] = useState<AttemptInfo | null>(null)
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

  // Keep codeRef in sync
  useEffect(() => {
    codeRef.current = code
  }, [code])

  const currentQuestion = questions[currentQIndex]
  const isDsaRound = roundInfo?.roundType === 'coding' || roundInfo?.roundType === 'oa' || roundInfo?.roundType === 'phone_screen'
  const isBehavioralRound = roundInfo?.roundType === 'behavioral'

  const { label: timerLabel, isWarning } = useTimer(roundInfo?.durationMinutes || 45)

  // Handle code changes with debounce (only for coding rounds)
  const handleAiTrigger = useCallback(
    (newCode: string) => {
      codeRef.current = newCode
      // AiChat's internal trigger handles sending — code is picked up via codeRef
    },
    [],
  )
  const { handleCodeChange } = useCodeDebounce(handleAiTrigger)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Load attempt to get pipeline info
    api.pipelines
      .getAttempt(token, attemptId)
      .then((data) => {
        setAttemptInfo({ pipelineId: data.attempt.pipelineId })
        setCompany(data.pipeline.company)

        // Find round info
        const round = data.rounds.find((r: any) => r.session?.id === roundId)
        if (round) {
          setRoundInfo({
            name: round.name,
            roundType: round.roundType,
            durationMinutes: round.durationMinutes,
            questionCount: round.questionCount,
          })

          // If round is already in_progress, load questions
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
    if (starterCode) {
      setCode(starterCode)
    }
  }

  const handleSubmit = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      // For DSA questions, submit code evaluations
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

      // Complete the round
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
      <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
        <Skeleton className="flex-1" />
        <Skeleton className="w-80" />
      </div>
    )
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-lg mx-auto text-center">
        <div>
          <h1 className="text-2xl font-semibold">{roundInfo?.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roundInfo?.durationMinutes} min · {roundInfo?.questionCount}{' '}
            {roundInfo?.questionCount === 1 ? 'question' : 'questions'}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {roundInfo?.roundType === 'coding' || roundInfo?.roundType === 'oa'
            ? 'You\'ll have an AI interviewer helping you through the problem. Think aloud and communicate your approach.'
            : 'Answer the questions clearly and concisely using the STAR method where appropriate.'}
        </p>
        <Button onClick={handleStartRound} disabled={starting} size="lg">
          {starting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading questions...
            </>
          ) : (
            'Start Round'
          )}
        </Button>
      </div>
    )
  }

  // Coding round — split pane
  if (isDsaRound && currentQuestion) {
    const testCases = currentQuestion.metadata?.testCases || []

    return (
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left panel: Problem + Editor */}
        <div className="flex flex-col flex-1 min-w-0 border-r">
          {/* Round info bar */}
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{company}</span>
              <span>·</span>
              <span>{roundInfo?.name}</span>
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
                      className={`h-6 w-6 rounded text-xs font-medium ${
                        i === currentQIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
              <span
                className={`rounded-full px-2 py-1 text-xs font-mono font-medium ${
                  isWarning
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Timer className="inline h-3 w-3 mr-1" />
                {timerLabel}
              </span>
            </div>
          </div>

          {/* Problem description */}
          <div className="flex-shrink-0 max-h-[40%] overflow-y-auto p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold">
                {currentQuestion.metadata?.title || `Problem ${currentQIndex + 1}`}
              </h2>
              <Badge variant="outline" className="text-xs capitalize">
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentQuestion.content}</p>

            {testCases.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowTestCases(!showTestCases)}
                >
                  {showTestCases ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Test cases ({testCases.length})
                </button>
                {showTestCases && (
                  <div className="mt-2 space-y-2">
                    {testCases.map((tc, i) => (
                      <div key={i} className="rounded-md bg-muted p-2 font-mono text-xs">
                        <div className="text-muted-foreground">Input: {tc.input}</div>
                        <div className="text-muted-foreground">Expected: {tc.expected}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Code editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/20">
              <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/pipeline/${attemptId}`}>Exit round</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
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
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          <AiChat
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

  // Behavioral / system design round — simple Q&A
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{roundInfo?.name}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQIndex + 1} of {questions.length}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-mono ${
            isWarning ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Timer className="inline h-3 w-3 mr-1" />
          {timerLabel}
        </span>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm leading-relaxed">{currentQuestion?.content}</p>
      </div>

      <textarea
        className="w-full rounded-md border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        rows={8}
        placeholder="Type your answer here..."
        value={currentQuestion ? (answers[currentQuestion.id] || '') : ''}
        onChange={(e) =>
          currentQuestion &&
          setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
        }
      />

      <div className="flex items-center justify-between">
        {currentQIndex > 0 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentQIndex((i) => i - 1)}
          >
            Previous
          </Button>
        ) : (
          <div />
        )}
        {currentQIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentQIndex((i) => i + 1)}>Next Question</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
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
  )
}
