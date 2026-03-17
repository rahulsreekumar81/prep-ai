# Plan: Company Hiring Pipeline + Interactive AI Interviewer

## Context

PrepAI currently has a flat interview flow: upload resume → get 10 questions → answer one at a time → see scores. This feels generic and nothing like a real interview process.

**The pivot**: Each company has a real multi-round hiring pipeline (Google: OA → Phone → 4 Onsite rounds). Users experience the actual pipeline. During coding rounds, an AI interviewer watches them code in real-time, gives hints, asks clarifying questions — like a real pair-programming interview.

**Why this matters**: No other free tool simulates the *process* of interviewing at a specific company. This is the differentiator.

---

## Architecture Overview

```
Current:  Interview → [10 flat questions] → Results
New:      Pipeline → [Round 1] → pass? → [Round 2] → ... → [Final Result]
                        ↑
              Coding rounds have live AI interviewer
```

**Real-time approach**: SSE (Server-Sent Events) over HTTP — NOT Firebase/RTDB. The AI chat is 1-to-1 (user ↔ AI), not multi-user. Postgres JSONB stores conversation history. SSE streams AI responses. Zero new infrastructure needed.

---

## Phase 1: MVP

One company (Google L3 SDE, 6 rounds) working end-to-end with interactive AI in coding rounds.

### Schema — 4 New Tables

**New enums:**
- `roundTypeEnum`: `['oa', 'phone_screen', 'coding', 'system_design', 'behavioral', 'mixed']`
- `attemptStatusEnum`: `['in_progress', 'passed', 'failed', 'abandoned']`
- `roundSessionStatusEnum`: `['pending', 'in_progress', 'completed', 'passed', 'failed']`

**New tables:**
- `companyPipelines` — pipeline definitions (company, role, description, passingThreshold)
- `pipelineRounds` — rounds within a pipeline (name, type, duration, questionCount, passingScore)
- `pipelineAttempts` — user's attempt at a pipeline (status, currentRoundIndex)
- `roundSessions` — one per round per attempt (status, score, aiConversation JSONB)

**Modifications:**
- `questions` table: add nullable `roundSessionId` FK
- Old interviews untouched — backward compatible

### Seed Data
- Google L3 SDE pipeline: 6 rounds (OA → Phone → Coding 1 → Coding 2 → System Design → Googleyness)

### Backend Routes
- `GET /api/pipelines` — list all company pipelines
- `POST /api/pipeline-attempts` — start attempt
- `POST /api/round-sessions/:id/start` — start round, generate questions
- `POST /api/round-sessions/:id/complete` — score round, pass/fail
- `POST /api/round-sessions/:id/ai-interact` — SSE streaming AI interviewer

### Interactive AI Interviewer
- SSE via Vercel AI SDK `streamText()` + Hono
- `llama-3.1-8b-instant` for interactive hints (20K tokens/min free tier)
- `llama-3.3-70b-versatile` for final evaluations
- 5-second client debounce, max 20 interactions per round
- AI persona: gives hints not answers, asks clarifying questions, matches company style

### Frontend Pages
- `/pipelines` — company grid
- `/pipelines/[company]` — pipeline detail + start
- `/pipeline/[attemptId]` — round stepper overview
- `/pipeline/[attemptId]/round/[roundId]` — active round (split pane for coding)
- `/pipeline/[attemptId]/result` — pipeline result

### Coding Round UI (Split Pane)
```
┌─────────────────────────┬──────────────────────┐
│  Problem Description    │   AI Interviewer      │
│  Test Cases             │   Chat Panel          │
├─────────────────────────┤   [streaming msgs]    │
│  CodeMirror Editor      │   [Type message...]   │
│  [language selector]    │   [Send]              │
└─────────────────────────┴──────────────────────┘
         [Submit Solution]        [Timer: 42:30]
```

---

## Groq Rate Limit Strategy

| Concern | Solution |
|---------|----------|
| 30 RPM limit | `llama-3.1-8b-instant` for interactive, `70b` for evaluations |
| Token budget | 8B model has 20K tokens/min (vs 6K for 70B) |
| Bursty changes | 5s client debounce + 4s server gap |
| Long sessions | Max 20 AI interactions per round |
| API down | Graceful degradation — round works without AI |

---

## Edge Cases

- Tab close mid-round → restore from last `aiConversation` snapshot
- AI gives away answer → prompt engineered against this; eval scores independently
- Empty code → AI asks for approach before giving hints
- Code too long → truncate to 150 lines for LLM prompt
- Old interviews → `/interview/*` routes untouched

---

## Phase 2 (After MVP)
- 5 more company pipelines (Amazon, Meta, Microsoft, Flipkart, Razorpay)
- Amazon Leadership Principles in behavioral rounds
- Timer enforcement, retry support
- History page, mobile responsive

## Phase 2.5: Interactive System Design Round (Excalidraw + AI)

**Prerequisite**: Complete Phase 1 (pipeline + DSA AI streaming) and UI revamp first.

### How It Works — Same SSE Pattern, No Firebase

```
User draws on Excalidraw → onChange captures elements JSON → debounced POST to backend
        ↓                                                            ↓
User sees AI elements appear ← SSE streams chat + diagram events ← LLM generates element JSON
```

The AI doesn't move a cursor in real-time. It generates **Excalidraw element skeletons** (rectangles, arrows, text) as JSON, streamed via SSE alongside chat messages. The frontend calls `excalidrawAPI.updateScene()` to render AI-drawn elements on the canvas.

**Same infra as coding rounds** — just an additional `event: diagram` type in the SSE stream.

### Excalidraw Technical Details

**Package**: `@excalidraw/excalidraw` (v0.18.0, ~47KB)

**Key APIs:**
```typescript
// Imperative API handle
<Excalidraw excalidrawAPI={(api) => setApi(api)} onChange={handleChange} />

// Read current diagram (to send to AI)
api.getSceneElements()  // → ExcalidrawElement[]

// Add AI-generated elements to canvas
api.updateScene({ elements: [...existing, ...aiGenerated] })

// Convert simplified skeletons to full elements
convertToExcalidrawElements(skeletons)
```

**Next.js**: Must use `dynamic(() => import(...), { ssr: false })` — Excalidraw doesn't support SSR.

### What the AI Generates

LLM outputs `ExcalidrawElementSkeleton[]` — simplified JSON that Excalidraw converts:

```json
[
  { "type": "rectangle", "x": 100, "y": 100, "width": 160, "height": 60,
    "backgroundColor": "#a5d8ff", "label": { "text": "API Gateway" } },
  { "type": "rectangle", "x": 350, "y": 100, "width": 160, "height": 60,
    "backgroundColor": "#b2f2bb", "label": { "text": "User Service" } },
  { "type": "arrow", "x": 260, "y": 130, "width": 90, "height": 0,
    "label": { "text": "REST" } }
]
```

### SSE Response Format (Multiplexed)

The existing `/api/round-sessions/:id/ai-interact` endpoint streams two event types for system design rounds:

```
event: chat
data: {"content": "Add a cache layer between your API and database for read-heavy traffic."}

event: diagram
data: {"action": "add", "elements": [{"type": "rectangle", ...}]}
```

Frontend handler:
- `event: chat` → append to AI chat panel (same as coding rounds)
- `event: diagram` → call `api.updateScene()` to add elements to canvas

### AI Diagram Actions

| Action | What it does | When |
|--------|-------------|------|
| `add` | Adds new boxes/arrows/text | AI suggests a component |
| `highlight` | Changes stroke color of existing elements | AI asks about a specific part |
| `annotate` | Adds text label near an element | AI points out an issue |

The AI does NOT delete user elements. User has full control.

### System Design Round UI Layout

```
┌─────────────────────────────────────────┬─────────────────────┐
│                                         │                     │
│         Excalidraw Canvas               │  AI Interviewer     │
│         (user draws + AI draws)         │  Chat Panel         │
│                                         │                     │
│   [AI elements appear in blue tint      │  "Consider adding   │
│    so user can distinguish them         │   a cache layer     │
│    from their own drawings]             │   between API       │
│                                         │   and database"     │
│                                         │                     │
├─────────────────────────────────────────┤  [Type message...]  │
│  Problem: "Design a URL Shortener"      │  [Send]             │
│  Requirements: 100M URLs/day, <100ms... │                     │
└─────────────────────────────────────────┴─────────────────────┘
                                                   [Timer: 38:12]
```

- Left (65%): Excalidraw canvas (top 75%) + problem description (bottom 25%, collapsible)
- Right (35%): AI chat panel (same component reused from coding rounds)
- AI-drawn elements: blue tint / dashed border to distinguish from user-drawn

### Evaluation Criteria (Different from Coding)

- **Architecture** (1-10): Right components? Sound design?
- **Scalability** (1-10): Handles stated requirements? Horizontal scaling?
- **Trade-offs** (1-10): Discussed alternatives? Justified choices?
- **Communication** (1-10): Explained thinking clearly?

Input to evaluator: final diagram JSON + conversation history + problem description.

### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/design-whiteboard.tsx` | Excalidraw wrapper with AI element injection |
| `apps/api/src/prompts/system-design-interviewer.ts` | Interactive SD interviewer prompt |
| `apps/api/src/prompts/system-design-evaluation.ts` | SD round evaluation prompt |

### Sub-phasing

**Phase 2.5a (MVP)**: Excalidraw + AI chat side-by-side. AI gives TEXT feedback only (observes diagram JSON, comments on it). No AI drawing. Same effort as coding round chat.

**Phase 2.5b (Full)**: AI generates diagram elements via SSE. Multiplexed `chat` + `diagram` events. Color-coded AI vs user elements. ~2 additional sessions.

### Dependencies

- `@excalidraw/excalidraw` added to `apps/web/package.json`
- Dynamic import with `ssr: false` for Next.js

---

## Phase 3 (Future)
- Code execution (Piston/Judge0)
- AI voice interviewer (TTS)
- Video recording (WebRTC)
- Analytics deep-dive

---

## Effort Estimate

| Phase | Scope | Sessions | Risk |
|-------|-------|----------|------|
| Phase 1 | Google pipeline + interactive AI + new UI | 3-5 | Medium |
| Phase 2 | 5 more companies + polish | 2-3 | Low |
| Phase 2.5a | System design: Excalidraw + AI chat (text only) | 1-2 | Low |
| Phase 2.5b | System design: AI draws on canvas | 2 | Medium |
| Phase 3 | Code execution + video | 5+ | High |
