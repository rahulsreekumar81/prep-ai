'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { toast } from 'sonner'
import {
  Loader2,
  Mic,
  Square,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Code2,
} from 'lucide-react'

// Lazy load the code editor to avoid SSR issues with CodeMirror
import dynamic from 'next/dynamic'
const CodeEditor = dynamic(() => import('@/components/code-editor').then((m) => ({ default: m.CodeEditor })), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />,
})

type Language = 'cpp' | 'javascript' | 'python' | 'go' | 'java'

const LANGUAGE_LABELS: Record<Language, string> = {
  cpp: 'C++',
  javascript: 'JavaScript',
  python: 'Python',
  go: 'Go',
  java: 'Java',
}

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

interface Evaluation {
  relevanceScore: number
  depthScore: number
  clarityScore: number
  structureScore: number
  overallScore: number
  feedback: string
  sampleAnswer: string
  tips: string[]
}

interface DsaEvaluation {
  type: 'dsa'
  correctnessScore: number
  efficiencyScore: number
  codeQualityScore: number
  edgeCaseScore: number
  overallScore: number
  feedback: string
  bugs: string[]
  optimizedSolution: string
  complexityAnalysis: {
    candidateTime: string
    candidateSpace: string
    optimalTime: string
    optimalSpace: string
  }
  tips: string[]
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/10</span>
      </div>
      <Progress value={score * 10} className="h-1.5" />
    </div>
  )
}

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>()
  const { token, _hasHydrated } = useAuth()
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [codeAnswer, setCodeAnswer] = useState('')
  const [language, setLanguage] = useState<Language>('python')
  const [evaluation, setEvaluation] = useState<Evaluation | DsaEvaluation | null>(null)
  const [loadingInterview, setLoadingInterview] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [typing, setTyping] = useState(false)
  const typingRef = useRef<NodeJS.Timeout | null>(null)

  const { isRecording, audioBlob, duration, startRecording, stopRecording, resetRecording } =
    useVoiceRecorder()

  const typeText = useCallback((text: string) => {
    if (typingRef.current) clearInterval(typingRef.current)
    setTyping(true)
    const chars = [...text]
    let i = 0
    typingRef.current = setInterval(() => {
      if (i >= chars.length) {
        if (typingRef.current) clearInterval(typingRef.current)
        typingRef.current = null
        setTyping(false)
        return
      }
      const char = chars[i]
      i++
      setAnswer((prev) => prev + char)
    }, 18)
  }, [])

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) {
      router.push('/auth/login')
      return
    }
    api.interviews
      .get(token, id)
      .then((data) => {
        setQuestions(data.questions || [])
      })
      .catch(() => toast.error('Failed to load interview'))
      .finally(() => setLoadingInterview(false))
  }, [token, id, router, _hasHydrated])

  // Warn before leaving during an active interview
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (questions.length > 0 && !evaluation) {
        e.preventDefault()
      }
    }

    const handlePopState = () => {
      if (questions.length > 0) {
        const leave = window.confirm(
          'Your interview is still in progress. Are you sure you want to leave? Your unanswered questions will be lost.',
        )
        if (!leave) {
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [questions.length, evaluation])

  // Auto-transcribe when recording stops
  useEffect(() => {
    if (audioBlob && token && !transcribing) {
      setTranscribing(true)
      api.interviews
        .transcribe(token, id, audioBlob)
        .then((data) => {
          if (data.transcript) {
            const prefix = answer.trim() ? ' ' : ''
            typeText(prefix + data.transcript)
          } else {
            toast.error('No speech detected. Try again.')
          }
        })
        .catch((err) => toast.error(err.message || 'Transcription failed — try speaking louder'))
        .finally(() => {
          setTranscribing(false)
          resetRecording()
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob])

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
    }
  }, [])

  // Initialize code editor with starter code when DSA question loads
  useEffect(() => {
    const q = questions[currentIndex]
    if (q?.type === 'dsa' && q.metadata?.starterCode) {
      setCodeAnswer(q.metadata.starterCode[language] || '')
    }
  }, [currentIndex, questions, language])

  const currentQuestion = questions[currentIndex]
  const isDsa = currentQuestion?.type === 'dsa'
  const isLastQuestion = currentIndex === questions.length - 1
  const progress = questions.length > 0 ? ((currentIndex + (evaluation ? 1 : 0)) / questions.length) * 100 : 0

  const handleSubmitAnswer = async () => {
    if (!token || !currentQuestion) return

    if (isDsa && !codeAnswer.trim()) {
      toast.error('Please write your code solution')
      return
    }
    if (!isDsa && !answer.trim()) {
      toast.error('Please provide an answer')
      return
    }

    setSubmitting(true)
    try {
      const result = await api.evaluations.submit(token, {
        questionId: currentQuestion.id,
        interviewId: id,
        answer: isDsa ? (answer.trim() || 'See code submission') : answer,
        ...(isDsa ? { codeAnswer, language } : {}),
      })
      setEvaluation(result)
    } catch (err: any) {
      toast.error(err.message || 'Evaluation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      if (token) {
        api.interviews.complete(token, id).catch(() => {})
      }
      router.push(`/interview/${id}/result`)
      return
    }
    setCurrentIndex((i) => i + 1)
    setAnswer('')
    setCodeAnswer('')
    setEvaluation(null)
    resetRecording()
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    // Load starter code for the new language
    if (currentQuestion?.metadata?.starterCode) {
      setCodeAnswer(currentQuestion.metadata.starterCode[lang] || '')
    }
  }

  if (!_hasHydrated || !token) return null

  if (loadingInterview) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions found for this interview.</p>
  }

  const isDsaEval = evaluation && 'type' in evaluation && evaluation.type === 'dsa'

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">
              {isDsa ? 'DSA Coding' : currentQuestion.type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {currentQuestion.difficulty}
            </Badge>
          </div>
          {isDsa && currentQuestion.metadata?.title && (
            <CardTitle className="text-base font-semibold">
              {currentQuestion.metadata.title}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{currentQuestion.content}</p>

          {/* Test cases for DSA */}
          {isDsa && currentQuestion.metadata?.testCases && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sample Test Cases:</p>
              {currentQuestion.metadata.testCases.map((tc, i) => (
                <div key={i} className="rounded-md bg-muted p-2 text-xs font-mono">
                  <div><span className="text-muted-foreground">Input:</span> {tc.input}</div>
                  <div><span className="text-muted-foreground">Expected:</span> {tc.expected}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer area */}
      {!evaluation && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {isDsa ? 'Your Solution' : 'Your answer'}
              </CardTitle>
              {isDsa && (
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as Language)}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDsa ? (
              <>
                {/* Code editor for DSA */}
                <div className="overflow-hidden rounded-md border">
                  <CodeEditor
                    value={codeAnswer}
                    onChange={setCodeAnswer}
                    language={language}
                    disabled={submitting}
                  />
                </div>

                {/* Optional text area for explaining approach */}
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Explain your approach (optional — voice or text):
                  </p>
                  <Textarea
                    placeholder="Explain your approach, time/space complexity..."
                    rows={3}
                    value={answer}
                    onChange={(e) => {
                      if (!typing) setAnswer(e.target.value)
                    }}
                    className="resize-none text-sm"
                    disabled={submitting || typing}
                  />
                </div>
              </>
            ) : (
              <div className="relative">
                <Textarea
                  placeholder="Type your answer here or use voice recording below..."
                  rows={6}
                  value={answer}
                  onChange={(e) => {
                    if (!typing) setAnswer(e.target.value)
                  }}
                  className="resize-none text-sm"
                  disabled={submitting || typing}
                />
                {typing && (
                  <span className="absolute bottom-3 right-3 h-4 w-0.5 animate-pulse bg-foreground" />
                )}
              </div>
            )}

            {/* Voice controls */}
            <div className="flex items-center gap-3">
              {isRecording ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={stopRecording}
                >
                  <Square className="mr-2 h-3 w-3" />
                  Stop ({duration}s)
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startRecording}
                  disabled={transcribing || submitting || typing}
                >
                  <Mic className="mr-2 h-3 w-3" />
                  {isDsa ? 'Explain approach' : 'Record voice'}
                </Button>
              )}

              {transcribing && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Processing audio...</span>
                </div>
              )}
              {typing && (
                <span className="text-xs text-muted-foreground">Typing transcript...</span>
              )}
            </div>

            <Separator />

            <Button
              onClick={handleSubmitAnswer}
              disabled={
                (isDsa ? !codeAnswer.trim() : !answer.trim()) ||
                submitting ||
                typing ||
                transcribing
              }
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : isDsa ? (
                'Submit Code'
              ) : (
                'Submit Answer'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Evaluation — DSA */}
      {isDsaEval && evaluation && 'correctnessScore' in evaluation && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Score</CardTitle>
                <span className="text-2xl font-bold">{evaluation.overallScore}/10</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScoreBar label="Correctness" score={evaluation.correctnessScore} />
              <ScoreBar label="Efficiency" score={evaluation.efficiencyScore} />
              <ScoreBar label="Code Quality" score={evaluation.codeQualityScore} />
              <ScoreBar label="Edge Cases" score={evaluation.edgeCaseScore} />
            </CardContent>
          </Card>

          {evaluation.complexityAnalysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Complexity Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Your Solution</p>
                    <p>Time: {evaluation.complexityAnalysis.candidateTime}</p>
                    <p>Space: {evaluation.complexityAnalysis.candidateSpace}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Optimal</p>
                    <p>Time: {evaluation.complexityAnalysis.optimalTime}</p>
                    <p>Space: {evaluation.complexityAnalysis.optimalSpace}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {evaluation.feedback}
              </p>
            </CardContent>
          </Card>

          {evaluation.bugs && evaluation.bugs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Bugs Found</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {evaluation.bugs.map((bug, i) => (
                    <li key={i} className="flex gap-2 text-sm text-red-600 dark:text-red-400">
                      <span className="mt-0.5 text-xs">•</span>
                      {bug}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {evaluation.tips.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 text-xs">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Optimized Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                <code>{evaluation.optimizedSolution}</code>
              </pre>
            </CardContent>
          </Card>

          <Button onClick={handleNext} className="w-full">
            {isLastQuestion ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                View Results
              </>
            ) : (
              <>
                Next Question
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Evaluation — Standard */}
      {evaluation && !isDsaEval && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Score</CardTitle>
                <span className="text-2xl font-bold">{evaluation.overallScore}/10</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScoreBar label="Relevance" score={(evaluation as Evaluation).relevanceScore} />
              <ScoreBar label="Depth" score={(evaluation as Evaluation).depthScore} />
              <ScoreBar label="Clarity" score={(evaluation as Evaluation).clarityScore} />
              <ScoreBar label="Structure" score={(evaluation as Evaluation).structureScore} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {evaluation.feedback}
              </p>
            </CardContent>
          </Card>

          {evaluation.tips.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 text-xs">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sample answer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {(evaluation as Evaluation).sampleAnswer}
              </p>
            </CardContent>
          </Card>

          <Button onClick={handleNext} className="w-full">
            {isLastQuestion ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                View Results
              </>
            ) : (
              <>
                Next Question
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
