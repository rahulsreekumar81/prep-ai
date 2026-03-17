import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-xl font-bold">PrepAI</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight">
          Crack your dream interview with{' '}
          <span className="text-primary">AI-powered</span> mock interviews
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Upload your resume, paste the job description, and get custom interview questions with
          real-time AI feedback. Practice with voice recording and company-specific preparation.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/auth/signup"
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
          >
            Start Free Mock Interview
          </Link>
          <Link
            href="#features"
            className="rounded-md border px-6 py-3 font-medium hover:bg-accent"
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-20 max-w-5xl mx-auto">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold text-lg">Custom Questions</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            AI generates role-specific questions based on your resume and the job description.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold text-lg">Voice Answers</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Record your answers via voice. AI transcribes and evaluates your response.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold text-lg">Company-Specific Prep</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            RAG-powered preparation aligned with Google, Amazon, Razorpay and more.
          </p>
        </div>
      </section>
    </main>
  )
}
