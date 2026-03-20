'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/store'
import { toast } from 'sonner'
import { Loader2, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, user } = await api.auth.login({ email, password })
      setAuth(token, user)
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0F14] px-6">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">PrepAI</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#1E2535] bg-[#161B26] p-8">
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-[#64748B] mb-6">Log in to your PrepAI account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#0F1219] border-[#1E2535] text-white placeholder:text-[#334155] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0F1219] border-[#1E2535] text-white placeholder:text-[#334155] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-[#64748B]">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[#60A5FA] hover:text-[#93C5FD]">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
