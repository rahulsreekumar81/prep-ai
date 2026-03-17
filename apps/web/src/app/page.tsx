import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { Mic, FileText, Building2, BarChart3, Target, Sparkles } from 'lucide-react'

const features = [
  { icon: FileText, title: 'Resume-Aware Questions', desc: 'AI generates questions targeting your specific experience and skills from your resume.' },
  { icon: Mic, title: 'Voice Answers', desc: 'Record answers via voice. AI transcribes and evaluates your spoken response.' },
  { icon: Building2, title: 'Company-Specific Prep', desc: 'Preparation aligned with Google, Amazon, Razorpay and 15+ companies.' },
  { icon: BarChart3, title: 'Detailed Scoring', desc: 'Scores on relevance, depth, clarity, and structure with a model answer.' },
  { icon: Target, title: 'Progress Tracking', desc: 'Track improvement over time. Identify weak areas and focus preparation.' },
  { icon: Sparkles, title: 'Affordable', desc: 'Starting at ₹499/month. Cheaper than a single session with a human coach.' },
]

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-lg font-semibold">PrepAI</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <Badge variant="secondary" className="mb-6">
          Powered by AI
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Crack your dream interview with AI
        </h1>
        <p className="mt-6 max-w-lg text-muted-foreground">
          Upload your resume, paste the job description, and practice with custom
          AI-generated questions tailored to your target company and role.
        </p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" asChild>
            <Link href="/auth/signup">Start Free Mock Interview</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required. 3 free interviews per month.
        </p>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader className="pb-2">
              <f.icon className="mb-1 h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        &copy; 2026 PrepAI. All rights reserved.
      </footer>
    </main>
  )
}
