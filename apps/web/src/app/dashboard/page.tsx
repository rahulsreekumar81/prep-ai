'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { Plus, BarChart3, Target, Clock, AlertTriangle } from 'lucide-react'

interface DashboardData {
  totalInterviews: number
  averageScore: number
  totalEvaluations: number
  weakAreas: string[]
  recentInterviews: any[]
}

export default function DashboardPage() {
  const { token, user, _hasHydrated } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!token) {
      router.push('/auth/login')
      return
    }
    api.users
      .dashboard(token)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token, router, _hasHydrated])

  if (!_hasHydrated || !token) return null

  if (!loading && error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <p className="text-sm font-medium">Could not load dashboard</p>
        <p className="text-xs text-muted-foreground">
          Make sure the API server is running and try refreshing.
        </p>
        <Button size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user?.name ? `Hey, ${user.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground">Your interview preparation overview</p>
        </div>
        <Button asChild>
          <Link href="/interview/new">
            <Plus className="mr-2 h-4 w-4" />
            New Interview
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Interviews
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.totalInterviews || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Score
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {data?.averageScore ? `${data.averageScore}/10` : '—'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Questions Answered
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.totalEvaluations || 0}</p>
              </CardContent>
            </Card>
          </div>

          {data?.weakAreas && data.weakAreas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Areas to improve</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                {data.weakAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="capitalize">
                    {area}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">Recent interviews</h2>
            {!data?.recentInterviews || data.recentInterviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No interviews yet</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/interview/new">Start your first interview</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {data.recentInterviews.map((interview: any) => (
                  <Link key={interview.id} href={`/interview/${interview.id}/result`}>
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {interview.companyName || 'General'}{' '}
                            {interview.roleTitle && `— ${interview.roleTitle}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(interview.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                          {interview.status === 'completed' ? 'Completed' : 'In progress'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
