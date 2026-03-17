# PrepAI — AI Interview Preparation Platform

## Project Overview

PrepAI is an AI-powered mock interview platform. Users upload resumes, paste job descriptions, and get custom interview questions. They answer via voice (recorded + transcribed) or text. AI evaluates answers with scores, feedback, and sample answers. RAG pipeline provides company-specific interview patterns.

## Monorepo Structure

```
prepai/
├── apps/
│   ├── api/          → Hono backend (Node.js)
│   ├── web/          → Next.js 14 web app
│   └── marketing/    → Astro marketing site
├── packages/
│   ├── shared/       → Types, validators, constants
│   ├── db/           → Drizzle ORM schema + migrations
│   └── ui/           → Shared React components (shadcn)
└── docs/             → BRD, system design, infra docs
```

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Package Manager**: pnpm (workspaces)
- **Build**: Turborepo
- **Language**: TypeScript (strict)
- **Backend**: Hono
- **Frontend**: Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Marketing**: Astro + Tailwind
- **Database**: Neon PostgreSQL + pgvector + Drizzle ORM
- **AI/LLM**: Groq API (Llama 3.1 70B)
- **STT**: Groq Whisper API
- **Auth**: Lucia Auth (session-based)
- **Validation**: Zod (shared between frontend + backend)
- **Deployment**: Vercel (frontend) + Railway (backend)

## Commands

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages and apps
pnpm lint             # Lint everything
pnpm type-check       # TypeScript check
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed company data for RAG
pnpm db:studio        # Open Drizzle Studio
```

## Code Conventions

- Use `@prepai/` prefix for all internal package imports
- Zod schemas in `packages/shared/src/validators/` — shared between frontend and backend
- Database schema in `packages/db/src/schema/`
- All AI prompts go in `apps/api/src/prompts/` as template literal functions
- API routes follow REST conventions in `apps/api/src/routes/`
- Use Hono RPC for type-safe frontend → backend calls
- Environment variables: never commit `.env`, use `.env.example` as reference
- Error handling: use Hono's built-in error handler middleware
- All API responses follow `{ data: T } | { error: string }` pattern

## AI Integration

- Primary LLM: Groq API with `llama-3.1-70b-versatile` model
- Speech-to-text: Groq `whisper-large-v3`
- Embeddings: Groq or Cohere embed for pgvector
- Use Vercel AI SDK for streaming responses
- All prompts are version-controlled in `apps/api/src/prompts/`
- RAG: company interview data stored in pgvector, queried via cosine similarity

## Audio Recording

- Browser MediaRecorder API captures audio as `audio/webm`
- Audio blobs uploaded to backend via multipart form data
- Backend sends to Groq Whisper for transcription
- Transcribed text displayed for user review before evaluation

## File Naming

- React components: PascalCase (`QuestionCard.tsx`)
- Hooks: camelCase with `use` prefix (`useVoiceRecorder.ts`)
- Routes/pages: kebab-case directories
- Utils/services: camelCase (`questionGenerator.ts`)
- Database schema: camelCase (`interviews.ts`)
- Shared types: PascalCase interfaces, camelCase for schemas

## Testing

- Unit tests: Vitest
- E2E tests: Playwright (later phase)
- Test files co-located: `*.test.ts` next to source files

## Important Notes

- Free tier deployment: Vercel + Railway + Neon + Groq (all free)
- pgvector is used instead of a separate vector DB — simpler architecture
- No Redis in MVP — add later if caching needed
- Audio files stored temporarily, not persisted long-term in MVP
- Company seed data in `packages/db/src/seed/companies/*.json`
