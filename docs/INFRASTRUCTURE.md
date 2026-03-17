# PrepAI — Infrastructure, Deployment & CI/CD

---

## 1. EC2 vs Serverless — Decision

| Factor | EC2 / ECS | Serverless (Lambda) |
|--------|-----------|---------------------|
| LLM response streaming | Easy (long-lived connections) | Hard (29s timeout, no SSE) |
| WebSocket (voice) | Native support | Needs API Gateway WS (complex) |
| Cold starts | None | 1-3s (bad UX) |
| Cost at low traffic | ~$15/month minimum | Near $0 |
| Cost at scale | Predictable | Can spike unexpectedly |
| Docker support | Native | Lambda containers (limited) |
| Background jobs | BullMQ workers in same cluster | Needs SQS + separate Lambda |
| Complexity | Medium | High (many services to wire) |

### Verdict: **ECS Fargate** (containerized, serverless-ish)

Best of both worlds:
- No server management (like serverless)
- No cold starts (like EC2)
- Docker containers (easy local dev → production)
- Scales to zero optional (Fargate Spot)
- Supports long-lived connections for streaming

---

## 2. AWS Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        AWS Account                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                    VPC (10.0.0.0/16)                 │     │
│  │                                                      │     │
│  │  ┌──────────────────────────────────────────────┐   │     │
│  │  │         Public Subnets (10.0.1.0/24)         │   │     │
│  │  │                                               │   │     │
│  │  │  ┌─────────────┐    ┌──────────────────┐     │   │     │
│  │  │  │     ALB     │    │   NAT Gateway    │     │   │     │
│  │  │  └──────┬──────┘    └──────────────────┘     │   │     │
│  │  └─────────┼──────────────────────────────────────┘   │     │
│  │            │                                          │     │
│  │  ┌─────────▼──────────────────────────────────────┐   │     │
│  │  │        Private Subnets (10.0.2.0/24)           │   │     │
│  │  │                                                 │   │     │
│  │  │  ┌─────────────────────────────────────────┐   │   │     │
│  │  │  │         ECS Fargate Cluster              │   │   │     │
│  │  │  │                                          │   │   │     │
│  │  │  │  ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │   │     │
│  │  │  │  │ API     │ │ API     │ │ Worker   │  │   │   │     │
│  │  │  │  │ Task 1  │ │ Task 2  │ │ Task     │  │   │   │     │
│  │  │  │  │ (Hono)  │ │ (Hono)  │ │ (BullMQ) │  │   │   │     │
│  │  │  │  └─────────┘ └─────────┘ └──────────┘  │   │   │     │
│  │  │  └─────────────────────────────────────────┘   │   │     │
│  │  │                                                 │   │     │
│  │  │  ┌──────────┐  ┌────────────┐  ┌───────────┐  │   │     │
│  │  │  │ RDS      │  │ElastiCache │  │ Qdrant    │  │   │     │
│  │  │  │ Postgres │  │ Redis      │  │ (ECS)     │  │   │     │
│  │  │  └──────────┘  └────────────┘  └───────────┘  │   │     │
│  │  └─────────────────────────────────────────────────┘   │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ S3               │  │ ECR          │  │ Secrets       │  │
│  │ (Resumes,        │  │ (Docker      │  │ Manager       │  │
│  │  Static Assets)  │  │  Images)     │  │ (API Keys)    │  │
│  └──────────────────┘  └──────────────┘  └───────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ CloudWatch (Logs + Metrics + Alarms)                  │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

External:
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Cloudflare   │  │ Vercel       │  │ Groq API     │
  │ (DNS + CDN)  │  │ (Frontend)   │  │ (LLM)        │
  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 3. Deployment Strategy

### Where Each App Deploys

| App | Platform | Why |
|-----|----------|-----|
| `apps/api` | AWS ECS Fargate | Long-lived connections, streaming, background jobs |
| `apps/web` | Vercel | Free tier, instant deploys, edge SSR, Next.js native |
| `apps/marketing` | Vercel | Static site, free, global CDN, perfect for Astro |

### Domain Setup

```
prepai.in           → Vercel (marketing site)
app.prepai.in       → Vercel (web app)
api.prepai.in       → AWS ALB → ECS (backend)
```

DNS managed by Cloudflare for CDN + DDoS protection.

---

## 4. CI/CD Pipeline (GitHub Actions)

### Pipeline Overview

```
Push to main
    │
    ├──> Lint + Type Check (all packages)
    ├──> Unit Tests
    ├──> Build
    │
    ├──> [apps/api changed?]
    │        │
    │        ├── Build Docker image
    │        ├── Push to ECR
    │        ├── Deploy to ECS (rolling update)
    │        └── Run DB migrations
    │
    ├──> [apps/web changed?]
    │        │
    │        └── Vercel auto-deploys from main
    │
    └──> [apps/marketing changed?]
             │
             └── Vercel auto-deploys from main
```

### GitHub Actions Workflows

#### `.github/workflows/ci.yml` — Runs on every PR

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type Check
        run: pnpm type-check

      - name: Unit Tests
        run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

#### `.github/workflows/deploy-api.yml` — Deploy backend to ECS

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - 'packages/**'

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: prepai-api
  ECS_CLUSTER: prepai-cluster
  ECS_SERVICE: prepai-api-service
  TASK_DEFINITION: prepai-api-task

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr-login
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & push Docker image
        env:
          ECR_REGISTRY: ${{ steps.ecr-login.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f apps/api/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Download current task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition $TASK_DEFINITION \
            --query taskDefinition > task-definition.json

      - name: Update task definition with new image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: prepai-api
          image: ${{ steps.ecr-login.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Run DB migrations
        run: |
          aws ecs run-task \
            --cluster $ECS_CLUSTER \
            --task-definition prepai-migrate-task \
            --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET],securityGroups=[$SG_ID]}"
```

#### `.github/workflows/deploy-web.yml` & `deploy-marketing.yml`

Vercel handles these automatically via GitHub integration. No workflow needed — just connect the repo to Vercel and configure:

```
Vercel Project: prepai-web
  Root Directory: apps/web
  Build Command: cd ../.. && pnpm turbo build --filter=@prepai/web
  Output Directory: apps/web/.next

Vercel Project: prepai-marketing
  Root Directory: apps/marketing
  Build Command: cd ../.. && pnpm turbo build --filter=@prepai/marketing
  Output Directory: apps/marketing/dist
```

---

## 5. Docker Setup

### `apps/api/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build
RUN pnpm --filter @prepai/api build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/package.json ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/apps/api ./apps/api

RUN pnpm install --frozen-lockfile --prod

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
```

### `docker-compose.yml` (Local Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: prepai
      POSTGRES_USER: prepai
      POSTGRES_PASSWORD: prepai_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  postgres_data:
  qdrant_data:
  ollama_data:
```

---

## 6. Environment Variables

### `.env.example`

```bash
# Database
DATABASE_URL=postgresql://prepai:prepai_dev@localhost:5432/prepai

# Redis
REDIS_URL=redis://localhost:6379

# AI Providers
GROQ_API_KEY=gsk_xxxxxxxxxxxx
TOGETHER_API_KEY=xxxxxxxxxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Vector DB
QDRANT_URL=http://localhost:6333

# Auth
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=xxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxx

# Storage
AWS_S3_BUCKET=prepai-resumes
AWS_ACCESS_KEY_ID=xxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxx
AWS_REGION=ap-south-1

# Payments
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxx

# App
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
MARKETING_URL=http://localhost:4321
NODE_ENV=development
```

---

## 7. Monitoring & Observability

### Logging

```
App Logs → CloudWatch Logs → CloudWatch Insights (query/search)
```

Structured JSON logging in the API:

```typescript
// Every request logged with context
{
    "level": "info",
    "timestamp": "2026-03-12T10:30:00Z",
    "method": "POST",
    "path": "/api/interviews",
    "userId": "user_abc",
    "duration": 234,
    "status": 200
}
```

### Metrics & Alarms

| Metric | Alarm Threshold | Action |
|--------|----------------|--------|
| API response time P95 | > 5s | Alert on Slack |
| Error rate (5xx) | > 5% | Alert + auto-scale |
| ECS CPU | > 80% | Auto-scale up |
| ECS Memory | > 85% | Auto-scale up |
| RDS connections | > 80% of max | Alert |
| LLM API errors | > 10% | Switch to fallback provider |
| Queue depth (BullMQ) | > 100 | Scale workers |

### Health Check Endpoint

```typescript
app.get('/health', async (c) => {
    const checks = {
        api: 'ok',
        db: await checkDB(),        // SELECT 1
        redis: await checkRedis(),  // PING
        llm: await checkLLM(),      // Simple completion test
    }

    const healthy = Object.values(checks).every(v => v === 'ok')

    return c.json(checks, healthy ? 200 : 503)
})
```

---

## 8. Cost Estimate (MVP — First 3 months)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| ECS Fargate (1 task, 0.5 vCPU, 1GB) | On-demand | ~$15 |
| RDS PostgreSQL (db.t3.micro) | Free tier | $0 |
| ElastiCache Redis (t3.micro) | | ~$12 |
| S3 (resume storage) | First 5GB free | ~$1 |
| ECR (Docker images) | 500MB free | $0 |
| CloudWatch | Basic free | ~$3 |
| Groq API (LLM) | Free tier (30 RPM) | $0 |
| Vercel (web + marketing) | Free tier | $0 |
| Cloudflare (DNS + CDN) | Free tier | $0 |
| Domain (prepai.in) | | ~$10/year |
| **Total** | | **~$30-35/month** |

Scales to ~$100-200/month at 500 users, still profitable with 20+ Pro subscribers.

---

## 9. Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/your-username/prepai.git
cd prepai
pnpm install

# 2. Start infrastructure
docker compose up -d

# 3. Pull a local model (optional, for offline dev)
docker exec -it prepai-ollama-1 ollama pull mistral

# 4. Setup environment
cp .env.example .env
# Edit .env with your Groq API key

# 5. Run database migrations
pnpm db:migrate

# 6. Seed sample data
pnpm db:seed

# 7. Start all apps in dev mode
pnpm dev

# Apps running:
#   API:        http://localhost:3001
#   Web:        http://localhost:3000
#   Marketing:  http://localhost:4321
```
