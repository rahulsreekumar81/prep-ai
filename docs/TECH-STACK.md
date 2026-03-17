# PrepAI — Tech Stack & Monorepo Structure

---

## 1. Monorepo Structure (pnpm workspaces)

```
prepai/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-api.yml
│       ├── deploy-web.yml
│       └── deploy-marketing.yml
├── packages/
│   ├── shared/                    # Shared types, utils, validators
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── user.ts
│   │   │   │   ├── interview.ts
│   │   │   │   ├── evaluation.ts
│   │   │   │   └── index.ts
│   │   │   ├── validators/
│   │   │   │   ├── resume.ts
│   │   │   │   └── interview.ts
│   │   │   ├── constants/
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── db/                        # Database schema & migrations
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   ├── interviews.ts
│   │   │   │   ├── questions.ts
│   │   │   │   ├── evaluations.ts
│   │   │   │   ├── subscriptions.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/
│   │   │   ├── seed/
│   │   │   └── index.ts           # Drizzle client export
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ui/                        # Shared UI components (shadcn-based)
│       ├── src/
│       │   ├── components/
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   └── index.ts
│       │   └── styles/
│       │       └── globals.css
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── api/                       # Hono Backend
│   │   ├── src/
│   │   │   ├── index.ts           # App entry
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── interview.ts
│   │   │   │   ├── evaluation.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── payment.ts
│   │   │   │   └── admin.ts
│   │   │   ├── services/
│   │   │   │   ├── ai.ts          # LLM integration
│   │   │   │   ├── resume-parser.ts
│   │   │   │   ├── question-generator.ts
│   │   │   │   ├── answer-evaluator.ts
│   │   │   │   ├── speech-to-text.ts
│   │   │   │   └── payment.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   ├── cors.ts
│   │   │   │   └── error-handler.ts
│   │   │   ├── lib/
│   │   │   │   ├── ai-client.ts   # Open model client (Ollama/vLLM)
│   │   │   │   ├── vector-db.ts   # ChromaDB/Qdrant client
│   │   │   │   └── cache.ts       # Redis client
│   │   │   └── prompts/
│   │   │       ├── question-generation.ts
│   │   │       ├── answer-evaluation.ts
│   │   │       └── prep-plan.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                       # Next.js Web App
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── signup/page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── interview/
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── [id]/result/page.tsx
│   │   │   │   ├── history/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── prep-plan/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── pricing/
│   │   │   │       └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── interview/
│   │   │   │   │   ├── question-card.tsx
│   │   │   │   │   ├── answer-input.tsx
│   │   │   │   │   ├── voice-recorder.tsx
│   │   │   │   │   ├── evaluation-card.tsx
│   │   │   │   │   └── timer.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── score-chart.tsx
│   │   │   │   │   ├── skill-radar.tsx
│   │   │   │   │   ├── streak-calendar.tsx
│   │   │   │   │   └── recent-interviews.tsx
│   │   │   │   ├── resume/
│   │   │   │   │   ├── upload-zone.tsx
│   │   │   │   │   └── parsed-preview.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── navbar.tsx
│   │   │   │       ├── sidebar.tsx
│   │   │   │       └── footer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-interview.ts
│   │   │   │   ├── use-voice-recorder.ts
│   │   │   │   └── use-auth.ts
│   │   │   └── lib/
│   │   │       ├── api-client.ts   # Hono RPC client
│   │   │       └── utils.ts
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── marketing/                 # Astro Marketing Site
│       ├── src/
│       │   ├── pages/
│       │   │   ├── index.astro         # Landing page
│       │   │   ├── pricing.astro
│       │   │   ├── about.astro
│       │   │   ├── blog/
│       │   │   │   ├── index.astro
│       │   │   │   └── [slug].astro
│       │   │   ├── privacy.astro
│       │   │   └── terms.astro
│       │   ├── layouts/
│       │   │   └── base.astro
│       │   ├── components/
│       │   │   ├── hero.astro
│       │   │   ├── features.astro
│       │   │   ├── pricing-table.astro
│       │   │   ├── testimonials.astro
│       │   │   ├── faq.astro
│       │   │   ├── cta.astro
│       │   │   ├── navbar.astro
│       │   │   └── footer.astro
│       │   ├── content/
│       │   │   └── blog/
│       │   │       ├── how-to-prepare-for-tech-interviews.md
│       │   │       └── ai-in-hiring.md
│       │   └── styles/
│       │       └── global.css
│       ├── astro.config.mjs
│       ├── tailwind.config.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## 2. Tech Stack Details

### Core Runtime

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20 LTS (or Bun) | Stable, wide ecosystem |
| Package Manager | pnpm | Fast, disk-efficient, great monorepo support |
| Build System | Turborepo | Parallel builds, caching, monorepo orchestration |
| Language | TypeScript (strict mode) | End-to-end type safety |

### Backend (apps/api)

| Concern | Technology | Why |
|---------|-----------|-----|
| Framework | Hono | Lightweight, fast, edge-ready, RPC for type-safe API |
| Validation | Zod | Schema validation, integrates with Hono and Drizzle |
| ORM | Drizzle | Type-safe, lightweight, great migrations |
| Database | PostgreSQL 16 | Reliable, JSON support, full-text search |
| Cache | Redis (Upstash) | Rate limiting, session cache, LLM response cache |
| Queue | BullMQ (Redis-backed) | Background jobs: resume parsing, evaluation processing |

### AI / ML Layer

| Concern | Technology | Why |
|---------|-----------|-----|
| Primary LLM | Llama 3.1 70B (via Groq or Together.ai) | Free/cheap API, fast inference, good quality |
| Fallback LLM | Mistral 7B (self-hosted via Ollama) | Local dev, zero cost |
| LLM Framework | Vercel AI SDK | Streaming, structured output, provider-agnostic |
| Vector Database | Qdrant (self-hosted) or Pinecone (managed) | RAG for company-specific questions |
| Embeddings | nomic-embed-text (via Ollama) or Cohere embed v3 | Free/cheap embeddings for RAG |
| Speech-to-Text | Whisper.cpp or Groq Whisper | Fast, free, accurate |
| PDF Parsing | pdf-parse (npm) | Simple, no Python dependency |

### Frontend — Web App (apps/web)

| Concern | Technology | Why |
|---------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSR, API routes, great DX |
| Styling | Tailwind CSS | Utility-first, fast development |
| Components | shadcn/ui | Accessible, customizable, copy-paste |
| Charts | Recharts | Simple charting for dashboard |
| State | Zustand | Lightweight global state |
| Forms | React Hook Form + Zod | Validation with shared schemas |
| Audio | Web Audio API + MediaRecorder | Voice recording in browser |
| API Client | Hono RPC Client | Type-safe API calls from frontend |

### Frontend — Marketing Site (apps/marketing)

| Concern | Technology | Why |
|---------|-----------|-----|
| Framework | Astro | Static site, perfect Lighthouse scores, great for SEO |
| Styling | Tailwind CSS | Consistent with web app |
| Content | Astro Content Collections | Markdown blog with type safety |
| Analytics | Plausible or PostHog | Privacy-friendly, open source |
| SEO | Built-in Astro SEO | Sitemap, meta tags, structured data |

### Shared Packages

| Package | Purpose |
|---------|---------|
| @prepai/shared | TypeScript types, Zod validators, constants |
| @prepai/db | Drizzle schema, migrations, database client |
| @prepai/ui | Shared React components (used by web + marketing if needed) |

---

## 3. Key Configuration Files

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".astro/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

### Root package.json

```json
{
  "name": "prepai",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "db:migrate": "turbo db:migrate --filter=@prepai/db",
    "db:seed": "turbo db:seed --filter=@prepai/db",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.2.0",
    "eslint": "^8.56.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

---

## 4. Open Model Strategy

### Why Open Models First

1. **Cost**: $0 for local dev, extremely cheap in production
2. **No vendor lock-in**: Switch providers anytime
3. **Privacy**: Resume data never leaves your infra
4. **Speed**: Groq serves Llama 3.1 at 500+ tokens/sec

### Model Selection

| Use Case | Model | Provider | Cost |
|----------|-------|----------|------|
| Question Generation | Llama 3.1 70B | Groq API | Free tier: 30 RPM |
| Answer Evaluation | Llama 3.1 70B | Groq API | Free tier: 30 RPM |
| Embeddings | nomic-embed-text | Ollama (local) | Free |
| Speech-to-Text | Whisper large-v3 | Groq API | Free tier available |
| Local Dev (all) | Mistral 7B / Llama 3.1 8B | Ollama | Free |

### Scaling Path

```
Stage 1 (MVP):      Groq free tier → $0/month
Stage 2 (100 users): Groq paid / Together.ai → $50-100/month
Stage 3 (1000 users): Self-hosted vLLM on GPU instance → $200-400/month
Stage 4 (scale):     Mix of self-hosted + Claude API for premium tier
```

### Provider Abstraction

Using Vercel AI SDK keeps the code provider-agnostic:

```typescript
// Switch from Groq to Claude by changing one line
import { createGroq } from '@ai-sdk/groq'
// import { createAnthropic } from '@ai-sdk/anthropic'

const model = createGroq('llama-3.1-70b-versatile')

const result = await generateText({
    model,
    prompt: '...',
})
```
