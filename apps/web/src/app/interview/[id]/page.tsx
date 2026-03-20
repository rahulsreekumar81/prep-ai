'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  Code2,
  Sparkles,
  Lightbulb,
} from 'lucide-react'

import dynamic from 'next/dynamic'
const CodeEditor = dynamic(
  () => import('@/components/code-editor').then((m) => ({ default: m.CodeEditor })),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full bg-[#0F1219]" /> },
)

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
  const color = score >= 7 ? '#22C55E' : score >= 5 ? '#F59E0B' : '#EF4444'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize text-[#94A3B8]">{label}</span>
        <span className="font-semibold text-white">{score}/10</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#1E2535] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-[#22C55E]/15 text-[#4ADE80]',
  medium: 'bg-[#F59E0B]/15 text-[#FCD34D]',
  hard: 'bg-[#EF4444]/15 text-[#F87171]',
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
      setAnswer((prev) => prev + chars[i++])
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
      .then((data) => setQuestions(data.questions || []))
      .catch(() => toast.error('Failed to load interview'))
      .finally(() => setLoadingInterview(false))
  }, [token, id, router, _hasHydrated])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (questions.length > 0 && !evaluation) e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [questions.length, evaluation])

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
        .catch((err) => toast.error(err.message || 'Transcription failed'))
        .finally(() => {
          setTranscribing(false)
          resetRecording()
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob])

  useEffect(() => {
    return () => { if (typingRef.current) clearInterval(typingRef.current) }
  }, [])

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
  const isDsaEval = evaluation && 'type' in evaluation && evaluation.type === 'dsa'

  const handleSubmitAnswer = async () => {
    if (!token || !currentQuestion) return
    if (isDsa && !codeAnswer.trim()) { toast.error('Please write your code solution'); return }
    if (!isDsa && !answer.trim()) { toast.error('Please provide an answer'); return }

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
      if (token) api.interviews.complete(token, id).catch(() => {})
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
    if (currentQuestion?.metadata?.starterCode) {
      setCodeAnswer(currentQuestion.metadata.starterCode[lang] || '')
    }
  }

  if (!_hasHydrated || !token) return null

  if (loadingInterview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48 bg-[#1E2535]" />
        <Skeleton className="h-2 w-full bg-[#1E2535]" />
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Skeleton className="h-48 bg-[#1E2535]" />
          <Skeleton className="h-48 bg-[#1E2535]" />
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return <p className="text-sm text-[#64748B]">No questions found for this interview.</p>
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA]">
            Question {currentIndex + 1} of {questions.length}
            {currentQuestion && ` · ${isDsa ? 'DSA Coding' : currentQuestion.type.replace('_', ' ')}`}
          </p>
          <span className="text-[11px] font-semibold text-[#64748B]">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-[#1E2535] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-5">
        {/* Left: Question + Answer */}
        <div className="space-y-4">
          {/* Question card */}
          <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                  isDsa ? 'bg-[#10B981]/15 text-[#6EE7B7]' : 'bg-[#F97316]/15 text-[#FDBA74]'
                }`}
              >
                {isDsa ? 'Coding' : currentQuestion.type.replace('_', ' ')}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                  DIFFICULTY_STYLES[currentQuestion.difficulty] || DIFFICULTY_STYLES.medium
                }`}
              >
                {currentQuestion.difficulty}
              </span>
            </div>
            {isDsa && currentQuestion.metadata?.title && (
              <h2 className="text-base font-bold text-white mb-2">{currentQuestion.metadata.title}</h2>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#94A3B8]">
              {currentQuestion.content}
            </p>
            {isDsa && currentQuestion.metadata?.testCases && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-medium text-[#64748B]">Sample cases:</p>
                {currentQuestion.metadata.testCases.map((tc, i) => (
                  <div key={i} className="rounded-lg bg-[#0F1219] border border-[#151C2E] p-2.5 font-mono text-xs">
                    <div><span className="text-[#64748B]">Input:</span> <span className="text-[#94A3B8]">{tc.input}</span></div>
                    <div><span className="text-[#64748B]">Expected:</span> <span className="text-[#94A3B8]">{tc.expected}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Answer area */}
          {!evaluation && (
            <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  {isDsa ? 'Your Solution' : 'Your Answer'}
                </p>
                {isDsa && (
                  <div className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-[#64748B]" />
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value as Language)}
                      className="rounded-lg border border-[#1E2535] bg-[#0F1219] px-2 py-1 text-xs text-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                    >
                      {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {isDsa ? (
                <>
                  <div className="overflow-hidden rounded-xl border border-[#1E2535]">
                    <CodeEditor
                      value={codeAnswer}
                      onChange={setCodeAnswer}
                      language={language}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs text-[#64748B]">Explain your approach (optional):</p>
                    <textarea
                      placeholder="Walk me through your approach, time/space complexity..."
                      rows={3}
                      value={answer}
                      onChange={(e) => { if (!typing) setAnswer(e.target.value) }}
                      className="w-full rounded-xl border border-[#1E2535] bg-[#0F1219] p-3 text-sm text-white placeholder:text-[#334155] resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                      disabled={submitting || typing}
                    />
                  </div>
                </>
              ) : (
                <div className="relative">
                  <textarea
                    placeholder="Type your answer here or use voice recording..."
                    rows={8}
                    value={answer}
                    onChange={(e) => { if (!typing) setAnswer(e.target.value) }}
                    className="w-full rounded-xl border border-[#1E2535] bg-[#0F1219] p-4 text-sm text-white placeholder:text-[#334155] resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                    disabled={submitting || typing}
                  />
                  {typing && (
                    <span className="absolute bottom-3 right-3 h-4 w-0.5 animate-pulse bg-white" />
                  )}
                </div>
              )}

              {/* Voice controls */}
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={stopRecording}
                    className="bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30 hover:bg-[#EF4444]/20"
                    variant="ghost"
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
                    className="border-[#1E2535] text-[#94A3B8] hover:bg-[#1C2235] hover:text-white"
                  >
                    <Mic className="mr-2 h-3 w-3" />
                    {isDsa ? 'Record approach' : 'Record answer'}
                  </Button>
                )}
                {(transcribing || typing) && (
                  <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {transcribing ? 'Processing...' : 'Typing...'}
                  </span>
                )}
              </div>

              <div className="border-t border-[#1E2535] pt-4">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={
                    (isDsa ? !codeAnswer.trim() : !answer.trim()) ||
                    submitting ||
                    typing ||
                    transcribing
                  }
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : isDsa ? 'Submit Code' : 'Submit Answer'}
                </Button>
              </div>
            </div>
          )}

          {/* Evaluation scores */}
          {evaluation && (
            <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Score</p>
                <span className={`text-2xl font-bold ${evaluation.overallScore >= 7 ? 'text-[#4ADE80]' : evaluation.overallScore >= 5 ? 'text-[#FCD34D]' : 'text-[#F87171]'}`}>
                  {evaluation.overallScore}/10
                </span>
              </div>
              <div className="space-y-2">
                {isDsaEval && evaluation && 'correctnessScore' in evaluation ? (
                  <>
                    <ScoreBar label="Correctness" score={evaluation.correctnessScore} />
                    <ScoreBar label="Efficiency" score={evaluation.efficiencyScore} />
                    <ScoreBar label="Code Quality" score={evaluation.codeQualityScore} />
                    <ScoreBar label="Edge Cases" score={evaluation.edgeCaseScore} />
                  </>
                ) : (
                  <>
                    <ScoreBar label="Relevance" score={(evaluation as Evaluation).relevanceScore} />
                    <ScoreBar label="Depth" score={(evaluation as Evaluation).depthScore} />
                    <ScoreBar label="Clarity" score={(evaluation as Evaluation).clarityScore} />
                    <ScoreBar label="Structure" score={(evaluation as Evaluation).structureScore} />
                  </>
                )}
              </div>

              {isDsaEval && evaluation && 'complexityAnalysis' in evaluation && (
                <div className="border-t border-[#1E2535] pt-3">
                  <p className="text-xs font-semibold text-[#64748B] mb-2">Complexity</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[#64748B] mb-0.5">Your solution</p>
                      <p className="text-[#94A3B8]">T: {evaluation.complexityAnalysis.candidateTime}</p>
                      <p className="text-[#94A3B8]">S: {evaluation.complexityAnalysis.candidateSpace}</p>
                    </div>
                    <div>
                      <p className="text-[#64748B] mb-0.5">Optimal</p>
                      <p className="text-[#4ADE80]">T: {evaluation.complexityAnalysis.optimalTime}</p>
                      <p className="text-[#4ADE80]">S: {evaluation.complexityAnalysis.optimalSpace}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleNext}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
                >
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
            </div>
          )}
        </div>

        {/* Right: AI Insights */}
        <div className="space-y-4">
          {/* Current Insights card */}
          <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#60A5FA]" />
              <p className="text-sm font-semibold text-white">Current Insights</p>
            </div>
            {evaluation ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-[#94A3B8]">{evaluation.feedback}</p>
                {isDsaEval && evaluation && 'bugs' in evaluation && evaluation.bugs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#F87171] mb-1.5">Bugs found</p>
                    <ul className="space-y-1">
                      {evaluation.bugs.map((bug, i) => (
                        <li key={i} className="flex gap-2 text-xs text-[#F87171]">
                          <span className="mt-0.5 flex-shrink-0">·</span>{bug}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="h-2.5 w-full rounded-full bg-[#1E2535] overflow-hidden">
                  <div className="h-full w-0 rounded-full bg-[#2563EB]/30 animate-pulse" />
                </div>
                <p className="text-xs text-[#334155]">Insights will appear after you submit your answer</p>
              </div>
            )}
          </div>

          {/* AI Feedback card */}
          <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-[#FCD34D]" />
              <p className="text-sm font-semibold text-white">AI Feedback</p>
            </div>
            {evaluation ? (
              <div className="space-y-3">
                {evaluation.tips.length > 0 && (
                  <ul className="space-y-2">
                    {evaluation.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#94A3B8]">
                        <span className="mt-0.5 flex-shrink-0 text-[#60A5FA]">·</span>{tip}
                      </li>
                    ))}
                  </ul>
                )}
                {!isDsaEval && (
                  <div className="border-t border-[#1E2535] pt-3">
                    <p className="text-xs font-semibold text-[#64748B] mb-2">Sample Answer</p>
                    <p className="text-xs leading-relaxed text-[#94A3B8]">
                      {(evaluation as Evaluation).sampleAnswer}
                    </p>
                  </div>
                )}
                {isDsaEval && evaluation && 'optimizedSolution' in evaluation && (
                  <div className="border-t border-[#1E2535] pt-3">
                    <p className="text-xs font-semibold text-[#64748B] mb-2">Optimized Solution</p>
                    <pre className="overflow-x-auto rounded-lg bg-[#0F1219] border border-[#151C2E] p-3 text-xs text-[#94A3B8] font-mono">
                      <code>{evaluation.optimizedSolution}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#334155]">Tips and sample answers will appear here after evaluation</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
