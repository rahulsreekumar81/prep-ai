'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/store'
import { api } from '@/lib/api-client'
import { ArrowRight, Plus, TrendingUp, Target, Clock, ChevronRight } from 'lucide-react'

interface DashboardData {
  totalInterviews: number
  averageScore: number
  totalEvaluations: number
  weakAreas: string[]
  recentInterviews: any[]
}

const companyGradients: Record<string, string> = {
  Google: 'from-[#4285F4]/20 to-[#EA4335]/10',
  Amazon: 'from-[#FF9900]/20 to-[#146EB4]/10',
  Meta: 'from-[#0668E1]/20 to-[#00C7E6]/10',
  Microsoft: 'from-[#7FBA00]/20 to-[#00A4EF]/10',
  Apple: 'from-[#555555]/20 to-[#999999]/10',
  Netflix: 'from-[#E50914]/20 to-[#B81D24]/10',
  Flipkart: 'from-[#2874F0]/20 to-[#F8E71C]/10',
  Razorpay: 'from-[#3395FF]/20 to-[#072654]/10',
}

const companyLetters: Record<string, string> = {
  Google: 'G',
  Amazon: 'A',
  Meta: 'M',
  Microsoft: 'Mi',
  Apple: 'Ap',
  Netflix: 'N',
  Flipkart: 'F',
  Razorpay: 'R',
}

const companyColors: Record<string, string> = {
  Google: 'bg-[#4285F4]',
  Amazon: 'bg-[#FF9900]',
  Meta: 'bg-[#0668E1]',
  Microsoft: 'bg-[#7FBA00]',
  Apple: 'bg-[#555555]',
  Netflix: 'bg-[#E50914]',
  Flipkart: 'bg-[#2874F0]',
  Razorpay: 'bg-[#3395FF]',
}

const popularCompanies = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Netflix', 'Flipkart']

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
        <p className="text-sm font-medium text-white">Could not load dashboard</p>
        <p className="text-xs text-[#64748B]">Make sure the API server is running and try refreshing.</p>
        <Button size="sm" onClick={() => window.location.reload()} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          Retry
        </Button>
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[36px] font-bold leading-tight tracking-tight text-white">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">Ready to crush your next interview?</p>
        </div>
        <Button
          asChild
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-[8px] px-4 py-2"
        >
          <Link href="/interview/new">
            <Plus className="mr-2 h-4 w-4" />
            New Interview
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
              <Skeleton className="h-3 w-24 bg-[#1E2535]" />
              <Skeleton className="mt-3 h-8 w-16 bg-[#1E2535]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">Total Interviews</p>
              <Clock className="h-4 w-4 text-[#64748B]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{data?.totalInterviews || 0}</p>
          </div>
          <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">Avg Score</p>
              <TrendingUp className="h-4 w-4 text-[#64748B]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">
              {data?.averageScore ? `${data.averageScore}/10` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">Questions Done</p>
              <Target className="h-4 w-4 text-[#64748B]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{data?.totalEvaluations || 0}</p>
          </div>
        </div>
      )}

      {/* Weak areas */}
      {!loading && data?.weakAreas && data.weakAreas.length > 0 && (
        <div className="rounded-xl border border-[#1E2535] bg-[#161B26] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F97316] mb-3">Areas to Improve</p>
          <div className="flex flex-wrap gap-2">
            {data.weakAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-3 py-1 text-xs font-medium capitalize text-[#FB923C]"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Try a new company */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Try a new company</p>
          <Link href="/pipelines" className="flex items-center gap-1 text-xs text-[#60A5FA] hover:text-[#93C5FD]">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {popularCompanies.map((company) => (
            <Link key={company} href={`/pipelines/${company.toLowerCase()}`}>
              <div
                className={`group relative overflow-hidden rounded-xl border border-[#1E2535] bg-gradient-to-br ${companyGradients[company] || 'from-[#1E2535]/50 to-[#161B26]'} p-4 transition-all hover:border-[#2563EB]/40 hover:shadow-[0_0_12px_rgba(37,99,235,0.15)] cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${companyColors[company] || 'bg-[#2563EB]'} text-sm font-bold text-white shadow-lg`}
                  >
                    {companyLetters[company] || company[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{company}</p>
                    <p className="text-[11px] text-[#64748B]">L3 SDE · 6 rounds</p>
                  </div>
                </div>
                <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent interviews */}
      <div>
        <p className="mb-4 text-sm font-semibold text-white">Recent Interviews</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-[#1E2535] bg-[#161B26]">
                <div className="flex h-full items-center px-5 gap-3">
                  <Skeleton className="h-3 w-32 bg-[#1E2535]" />
                  <Skeleton className="h-3 w-20 bg-[#1E2535]" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.recentInterviews || data.recentInterviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E2535] p-10 text-center">
            <p className="text-sm text-[#64748B]">No interviews yet</p>
            <Button
              asChild
              className="mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
              size="sm"
            >
              <Link href="/interview/new">Start your first interview</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentInterviews.map((interview: any) => (
              <Link key={interview.id} href={`/interview/${interview.id}/result`}>
                <div className="flex items-center justify-between rounded-xl border border-[#1E2535] bg-[#161B26] px-5 py-4 transition-colors hover:bg-[#1C2235] hover:border-[#2563EB]/30">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {interview.companyName || 'General Interview'}
                      {interview.roleTitle && (
                        <span className="text-[#64748B]"> — {interview.roleTitle}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      {new Date(interview.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      interview.status === 'completed'
                        ? 'bg-[#22C55E]/15 text-[#4ADE80]'
                        : 'bg-[#1C2235] text-[#94A3B8]'
                    }`}
                  >
                    {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
