'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
    metadata?: {
      title?: string
      starterCode?: Record<string, string>
      testCases?: Array<{ input: string; expected: string }>
    } | null
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

function QuestionCard({ item, index }: { item: QuestionResult; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const eval_ = item.evaluation
  const isDsa = item.question.type === 'dsa'

  return (
    <Card>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {isDsa ? 'DSA Coding' : item.question.type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {item.question.difficulty}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {eval_ ? (
                <span className="text-sm font-bold">{eval_.overallScore}/10</span>
              ) : (
                <span className="text-xs text-muted-foreground">Skipped</span>
              )}
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          {isDsa && item.question.metadata?.title && (
            <p className="text-sm font-medium">{item.question.metadata.title}</p>
          )}
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.question.content}</p>

          {eval_ ? (
            <>
              <Separator />

              {/* Code answer for DSA */}
              {isDsa && eval_.codeAnswer && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Your code</p>
                    {eval_.language && (
                      <Badge variant="outline" className="text-xs">
                        {eval_.language}
                      </Badge>
                    )}
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    <code>{eval_.codeAnswer}</code>
                  </pre>
                </div>
              )}

              {/* Text answer */}
              {(!isDsa || (eval_.userAnswer && eval_.userAnswer !== 'See code submission')) && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {isDsa ? 'Your explanation' : 'Your answer'}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{eval_.userAnswer}</p>
                </div>
              )}

              {/* Scores — different labels for DSA */}
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
                <p className="mb-2 text-xs font-medium text-muted-foreground">Feedback</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{eval_.feedback}</p>
              </div>

              {eval_.tips && eval_.tips.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Tips</p>
                  <ul className="space-y-1">
                    {eval_.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 text-xs">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {isDsa ? 'Optimized solution' : 'Sample answer'}
                </p>
                {isDsa ? (
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    <code>{eval_.sampleAnswer}</code>
                  </pre>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {eval_.sampleAnswer}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No answer submitted for this question.</p>
          )}
        </CardContent>
      )}
    </Card>
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
    if (!token) {
      router.push('/auth/login')
      return
    }
    api.evaluations
      .getSummary(token, id)
      .then(setData)
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [token, id, router, _hasHydrated])

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
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Could not load interview results.</p>
  }

  const scoreColor =
    data.averageScore >= 7 ? 'text-green-600' : data.averageScore >= 5 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Interview Results</h1>
          <p className="text-sm text-muted-foreground">
            {data.answeredQuestions} of {data.totalQuestions} questions answered
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${scoreColor}`}>{data.averageScore}/10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions Answered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.answeredQuestions}/{data.totalQuestions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.totalQuestions > 0
                ? Math.round((data.answeredQuestions / data.totalQuestions) * 100)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual question results */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Question breakdown</h2>
        <div className="space-y-3">
          {data.results.map((item, i) => (
            <QuestionCard key={item.question.id} item={item} index={i} />
          ))}
        </div>
      </div>

      <Button className="w-full" asChild>
        <Link href="/interview/new">Start New Interview</Link>
      </Button>
    </div>
  )
}
