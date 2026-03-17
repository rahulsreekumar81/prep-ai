# PrepAI — System Design

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│   │  Web App      │  │  Marketing   │  │  Mobile (Future)  │    │
│   │  (Next.js)    │  │  (Astro)     │  │  (React Native)   │    │
│   │  app.prepai.in│  │  prepai.in   │  │                   │    │
│   └──────┬───────┘  └──────┬───────┘  └───────┬───────────┘    │
│          │                 │                    │                 │
└──────────┼─────────────────┼────────────────────┼────────────────┘
           │                 │                    │
           ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE (Edge Layer)                       │
│   ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐    │
│   │  CDN     │  │  DNS     │  │  WAF    │  │  DDoS Shield │    │
│   └─────────┘  └──────────┘  └─────────┘  └──────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     AWS — Application Layer                       │
│                                                                   │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              Application Load Balancer                │      │
│   │              (api.prepai.in)                          │      │
│   └──────────────────────┬───────────────────────────────┘      │
│                          │                                       │
│          ┌───────────────┼───────────────┐                      │
│          ▼               ▼               ▼                      │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│   │  ECS Task 1 │ │  ECS Task 2 │ │  ECS Task 3 │             │
│   │  (Hono API) │ │  (Hono API) │ │  (Hono API) │             │
│   │  Container   │ │  Container   │ │  Container   │             │
│   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘             │
│          │               │               │                      │
│          └───────────────┼───────────────┘                      │
│                          │                                       │
│          ┌───────────────┼───────────────────────┐              │
│          ▼               ▼               ▼       ▼              │
│   ┌──────────┐  ┌──────────────┐  ┌────────┐  ┌──────────┐   │
│   │PostgreSQL│  │ Redis        │  │ Qdrant │  │ S3       │   │
│   │ (RDS)    │  │ (ElastiCache)│  │ (ECS)  │  │ (Resumes)│   │
│   └──────────┘  └──────────────┘  └────────┘  └──────────┘   │
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              Background Workers (ECS)                 │      │
│   │  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │      │
│   │  │Resume Parser │  │ Evaluation │  │ Prep Plan   │  │      │
│   │  │Worker        │  │ Worker     │  │ Generator   │  │      │
│   │  └──────────────┘  └────────────┘  └─────────────┘  │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     External AI Services                         │
│   ┌───────────┐  ┌────────────┐  ┌─────────────────────┐       │
│   │  Groq API │  │ Together.ai│  │ Ollama (dev only)   │       │
│   │  (LLM)    │  │ (fallback) │  │ (local models)      │       │
│   └───────────┘  └────────────┘  └─────────────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Design (PostgreSQL)

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    users     │     │   interviews     │     │   questions      │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)      │────<│ id (PK)          │────<│ id (PK)          │
│ email        │     │ user_id (FK)     │     │ interview_id(FK) │
│ name         │     │ resume_id (FK)   │     │ content          │
│ password_hash│     │ job_description  │     │ type             │
│ avatar_url   │     │ company_name     │     │ difficulty       │
│ plan         │     │ role_title       │     │ order_index      │
│ stripe_id    │     │ status           │     │ created_at       │
│ created_at   │     │ overall_score    │     └────────┬─────────┘
│ updated_at   │     │ fit_score        │              │
└──────┬───────┘     │ created_at       │              │
       │             │ completed_at     │     ┌────────▼─────────┐
       │             └──────────────────┘     │   evaluations    │
       │                                      ├──────────────────┤
       │             ┌──────────────────┐     │ id (PK)          │
       │             │    resumes       │     │ question_id (FK) │
       │             ├──────────────────┤     │ user_answer      │
       └────────────<│ id (PK)          │     │ audio_url        │
                     │ user_id (FK)     │     │ relevance_score  │
                     │ file_url         │     │ depth_score      │
                     │ parsed_text      │     │ clarity_score    │
                     │ skills (JSONB)   │     │ structure_score  │
                     │ experience_years │     │ overall_score    │
                     │ created_at       │     │ feedback         │
                     └──────────────────┘     │ sample_answer    │
                                              │ created_at       │
┌──────────────────┐                          └──────────────────┘
│  subscriptions   │
├──────────────────┤     ┌──────────────────┐
│ id (PK)          │     │  prep_plans      │
│ user_id (FK)     │     ├──────────────────┤
│ plan             │     │ id (PK)          │
│ status           │     │ user_id (FK)     │
│ razorpay_sub_id  │     │ target_role      │
│ current_period_  │     │ weak_areas(JSONB)│
│   start          │     │ plan_data (JSONB)│
│ current_period_  │     │ progress (JSONB) │
│   end            │     │ created_at       │
│ created_at       │     │ updated_at       │
└──────────────────┘     └──────────────────┘
```

### Drizzle Schema (Key Tables)

```typescript
// packages/db/src/schema/users.ts
import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['free', 'pro', 'premium'])

export const users = pgTable('users', {
    id: text('id').primaryKey(),              // cuid2
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash'),
    avatarUrl: text('avatar_url'),
    plan: planEnum('plan').default('free'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})

// packages/db/src/schema/interviews.ts
export const interviews = pgTable('interviews', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id),
    resumeId: text('resume_id').references(() => resumes.id),
    jobDescription: text('job_description').notNull(),
    companyName: text('company_name'),
    roleTitle: text('role_title'),
    status: text('status').default('in_progress'),   // in_progress | completed
    overallScore: integer('overall_score'),
    fitScore: integer('fit_score'),
    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at'),
})
```

---

## 3. API Design

### RESTful Endpoints

```
AUTH
  POST   /api/auth/signup              # Email/password signup
  POST   /api/auth/login               # Email/password login
  POST   /api/auth/google              # Google OAuth
  POST   /api/auth/logout              # Invalidate session
  GET    /api/auth/me                  # Get current user

RESUME
  POST   /api/resumes/upload           # Upload & parse resume (PDF)
  GET    /api/resumes                  # List user's resumes
  GET    /api/resumes/:id              # Get parsed resume
  DELETE /api/resumes/:id              # Delete resume

INTERVIEW
  POST   /api/interviews               # Start new interview session
  GET    /api/interviews               # List past interviews
  GET    /api/interviews/:id           # Get interview details + questions
  POST   /api/interviews/:id/complete  # Mark interview as complete

QUESTIONS
  GET    /api/interviews/:id/questions         # Get generated questions
  POST   /api/interviews/:id/questions/:qid/answer  # Submit answer (text)
  POST   /api/interviews/:id/questions/:qid/audio   # Submit answer (audio)

EVALUATION
  GET    /api/interviews/:id/questions/:qid/evaluation  # Get evaluation
  GET    /api/interviews/:id/summary                     # Full session summary

DASHBOARD
  GET    /api/dashboard/stats          # Overall stats (total interviews, avg score)
  GET    /api/dashboard/progress       # Score trend over time
  GET    /api/dashboard/weak-areas     # Skill-wise breakdown
  GET    /api/dashboard/streak         # Practice streak data

PREP PLAN
  POST   /api/prep-plans               # Generate new prep plan
  GET    /api/prep-plans/:id           # Get plan details
  PATCH  /api/prep-plans/:id           # Update progress

PAYMENT
  POST   /api/payments/create-order    # Create Razorpay order
  POST   /api/payments/verify          # Verify payment signature
  POST   /api/payments/webhook         # Razorpay webhook handler
  GET    /api/payments/subscription    # Get current subscription

ADMIN
  GET    /api/admin/users              # List users (paginated)
  GET    /api/admin/analytics          # Revenue, signups, usage stats
```

### Request/Response Examples

#### Start Interview

```
POST /api/interviews
Content-Type: application/json

{
    "resumeId": "resume_abc123",
    "jobDescription": "We are looking for a Senior Frontend Developer...",
    "companyName": "Razorpay",
    "roleTitle": "SDE-2 Frontend"
}

Response 200:
{
    "id": "interview_xyz789",
    "status": "in_progress",
    "fitScore": 72,
    "questions": [
        {
            "id": "q_001",
            "content": "Tell me about a time you optimized a React application's performance. What was the bottleneck and how did you solve it?",
            "type": "behavioral",
            "difficulty": "medium",
            "orderIndex": 1
        },
        // ... 9 more questions
    ]
}
```

#### Submit Answer & Get Evaluation

```
POST /api/interviews/interview_xyz789/questions/q_001/answer
Content-Type: application/json

{
    "answer": "In my previous role, we had a dashboard that was rendering 500+ rows..."
}

Response 200:
{
    "evaluation": {
        "relevanceScore": 8,
        "depthScore": 6,
        "clarityScore": 7,
        "structureScore": 5,
        "overallScore": 6.5,
        "feedback": "Good specific example. However, you didn't follow STAR format — your result section was weak. Quantify the improvement (e.g., 'reduced render time from 3s to 200ms').",
        "sampleAnswer": "In my previous role at XYZ, we faced a performance issue with our analytics dashboard (Situation). I was tasked with reducing the initial load time... (Task). I implemented virtualized rendering using react-window and memoized expensive calculations... (Action). This reduced render time from 3.2s to 180ms — a 94% improvement, and our user satisfaction scores increased by 23%... (Result).",
        "tips": [
            "Always quantify results with numbers",
            "Use STAR format: Situation → Task → Action → Result",
            "Mention the business impact, not just technical details"
        ]
    }
}
```

---

## 4. AI Pipeline Architecture

### Question Generation Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│ Resume Text  │────>│              │     │                  │
│              │     │   Prompt     │────>│   LLM (Llama 3)  │
│ Job          │────>│   Builder    │     │   via Groq API   │
│ Description  │     │              │     │                  │
└─────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                           ┌───────────────────────┘
                           ▼
                    ┌──────────────┐     ┌──────────────────┐
                    │   Zod        │────>│  10-15 Typed     │
                    │   Validator  │     │  Questions        │
                    │              │     │  (JSON)           │
                    └──────────────┘     └──────────────────┘
```

### Answer Evaluation Pipeline

```
┌──────────────┐
│ Audio Input  │───> Whisper STT ───> Text
└──────────────┘                        │
                                        ▼
┌──────────────┐              ┌──────────────────┐
│ Text Input   │─────────────>│                  │
└──────────────┘              │   Evaluation     │
                              │   Prompt +       │
┌──────────────┐              │   Rubric         │
│ Question     │─────────────>│                  │
│ Context      │              └────────┬─────────┘
└──────────────┘                       │
                                       ▼
                              ┌──────────────────┐
                              │   LLM (Llama 3)  │
                              │   Structured      │
                              │   Output          │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ Scores + Feedback │
                              │ + Sample Answer   │
                              └──────────────────┘
```

### RAG Pipeline (Company-Specific Questions)

```
┌───────────────────┐
│ Company Interview  │
│ Data (scraped/     │───> Chunk ───> Embed ───> Store in Qdrant
│ manual)            │
└───────────────────┘

At query time:

┌──────────────┐     ┌──────────┐     ┌────────────┐
│ "Prepare for │────>│ Embed    │────>│ Qdrant     │
│  Google SDE2"│     │ Query    │     │ Similarity │
└──────────────┘     └──────────┘     │ Search     │
                                      └─────┬──────┘
                                            │
                                            ▼
                                      ┌────────────┐     ┌──────────┐
                                      │ Top 5      │────>│ LLM      │──> Company-specific
                                      │ Relevant   │     │ Generate │    questions
                                      │ Chunks     │     └──────────┘
                                      └────────────┘
```

---

## 5. Caching Strategy

```
┌─────────────────────────────────────────────────────┐
│                   Redis Cache Layers                 │
├──────────────────┬────────────┬──────────────────────┤
│ Layer            │ TTL        │ What                  │
├──────────────────┼────────────┼──────────────────────┤
│ Session          │ 7 days     │ User auth sessions    │
│ Rate Limit       │ 1 minute   │ API rate counters     │
│ LLM Response     │ 24 hours   │ Common Q&A pairs      │
│ Resume Parse     │ 30 days    │ Parsed resume data    │
│ Dashboard Stats  │ 5 minutes  │ Aggregated metrics    │
└──────────────────┴────────────┴──────────────────────┘
```

### Cache-aside pattern for LLM responses:

```typescript
async function generateQuestions(resumeHash: string, jdHash: string) {
    const cacheKey = `questions:${resumeHash}:${jdHash}`

    // Check cache first
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // Generate from LLM
    const questions = await llm.generate(prompt)

    // Cache for next time
    await redis.set(cacheKey, JSON.stringify(questions), 'EX', 86400)

    return questions
}
```

---

## 6. Scaling Considerations

### Stage 1: MVP (0-100 users)

```
- Single ECS task (1 vCPU, 2GB RAM)
- RDS db.t3.micro (free tier)
- Groq free tier for LLM
- Total cost: ~$15-25/month
```

### Stage 2: Growth (100-1000 users)

```
- 2-3 ECS tasks behind ALB
- RDS db.t3.small
- ElastiCache t3.micro for Redis
- Groq paid tier or Together.ai
- Total cost: ~$100-200/month
```

### Stage 3: Scale (1000-10000 users)

```
- ECS auto-scaling (2-10 tasks)
- RDS db.r6g.large with read replica
- ElastiCache r6g.large
- Self-hosted vLLM on g5.xlarge for LLM
- Total cost: ~$500-1000/month
```

---

## 7. Security

| Concern | Solution |
|---------|----------|
| Auth | JWT with httpOnly cookies, refresh token rotation |
| Passwords | bcrypt with salt rounds = 12 |
| Resume storage | S3 with server-side encryption (SSE-S3) |
| API security | Rate limiting (100 req/min free, 500 req/min pro) |
| Input validation | Zod on every endpoint |
| SQL injection | Drizzle ORM (parameterized queries) |
| XSS | React auto-escaping + CSP headers |
| CORS | Strict origin whitelist |
| Secrets | AWS Secrets Manager, never in code |
| File upload | Max 5MB, PDF/DOCX only, virus scan |
