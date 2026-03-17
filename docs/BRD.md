# PrepAI — AI Interview Preparation Platform

## Business Requirements Document (BRD)

---

## 1. Executive Summary

PrepAI is an AI-powered interview preparation platform that generates personalized mock interviews based on a candidate's resume and target job description. It evaluates answers in real-time, provides actionable feedback, tracks progress over time, and creates customized preparation plans.

### Vision

Become the go-to AI interview coach for job seekers in India and beyond — replacing expensive human coaching with affordable, always-available, personalized AI preparation.

### Problem Statement

- Interview preparation is unstructured — candidates don't know what to prepare
- Human mock interviews are expensive (₹500-2000/session) and hard to schedule
- Generic question banks don't match specific roles or companies
- No feedback loop — candidates repeat the same mistakes
- India has 1.5M+ tech job seekers annually with no affordable prep tool

### Target Users

| Segment | Description | Pain Point |
|---------|-------------|------------|
| Fresh graduates | 0-1 YOE, campus placements | Don't know what to expect |
| Job switchers | 2-5 YOE, targeting better companies | Need role-specific prep |
| Career changers | Moving into tech/AI roles | Need to bridge skill gaps |
| Coaching institutes | Bulk student preparation | Need scalable solution |

---

## 2. Product Features

### 2.1 MVP (Phase 1 — Week 1-5)

#### F1: Resume & JD Analysis
- Upload resume (PDF/DOCX)
- Paste or upload job description
- AI extracts: skills, experience level, role type, company context
- Generates candidate-role fit score

#### F2: Custom Question Generation
- Generates 10-15 interview questions per session
- Question types: Technical, Behavioral (STAR), System Design, Situational
- Difficulty adapts to candidate's experience level
- Company-specific patterns (e.g., Amazon Leadership Principles)

#### F3: Answer Evaluation
- User types or speaks their answer
- AI scores on: Relevance (1-10), Depth (1-10), Clarity (1-10), Structure (1-10)
- Provides specific feedback: what was good, what was missing
- Generates an ideal sample answer for comparison

#### F4: Speech-to-Text Interview Mode
- Record audio answers via browser
- Transcribe using open-source Whisper model
- Evaluate transcribed answer
- Bonus: analyze filler words, speaking pace

#### F5: Dashboard & Progress Tracking
- Interview history with scores
- Skill-wise breakdown (strong/weak areas)
- Progress charts over time
- Streak tracking for daily practice

#### F6: Auth & User Management
- Email/password + Google OAuth
- Free and Pro tier access control
- Session management

### 2.2 Phase 2 (Week 6-10)

#### F7: AI Preparation Plan
- Based on weak areas, generate a day-by-day prep plan
- Recommend topics, resources, practice questions
- Adaptive — updates as user improves

#### F8: Company-Specific Prep
- RAG pipeline with company interview patterns
- Scrape/store common questions per company (Glassdoor-style data)
- "Prepare for Google SDE-2" mode

#### F9: Payment Integration
- Razorpay for India (UPI, cards, netbanking)
- Stripe for international
- Subscription management (monthly/yearly)

#### F10: Admin Panel
- User analytics
- Revenue dashboard
- Content management (add company data, question banks)

### 2.3 Phase 3 (Week 11+)

#### F11: Real-time Video Mock Interview
- WebRTC video with AI interviewer avatar
- Live follow-up questions based on answers
- Full interview simulation (45 min rounds)

#### F12: Peer Mock Interviews
- Match two users for practice
- AI moderates and scores both

#### F13: B2B — Institute Dashboard
- Bulk student onboarding
- Placement officer analytics
- Batch-wise performance reports

---

## 3. Revenue Model

### Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0 | 3 mock interviews/month, basic feedback |
| Pro | ₹499/month or ₹3999/year | Unlimited interviews, voice mode, detailed analytics, prep plans |
| Premium | ₹999/month | Pro + company-specific prep, priority support |
| Institute | ₹2000/month per 50 students | Bulk access, admin dashboard, analytics |

### Revenue Projections (Conservative)

```
Month 3:  100 Pro users  × ₹499  = ₹49,900/month
Month 6:  500 Pro users  × ₹499  = ₹2,49,500/month
Month 12: 2000 Pro users × ₹499  = ₹9,98,000/month
          + 10 Institutes × ₹2000 = ₹20,000/month
          Total ARR ≈ ₹1.2 Cr
```

---

## 4. User Flows

### 4.1 Core Interview Flow

```
Landing Page → Sign Up → Upload Resume → Paste JD
    ↓
AI Analyzes Resume + JD
    ↓
Generates Custom Questions (10-15)
    ↓
User Answers (Text or Voice)
    ↓
AI Evaluates Each Answer → Score + Feedback + Sample Answer
    ↓
Session Summary → Overall Score + Weak Areas
    ↓
Dashboard Updated → Progress Tracked
    ↓
AI Suggests Next Steps / Prep Plan
```

### 4.2 Returning User Flow

```
Login → Dashboard → See Weak Areas
    ↓
"Practice Weak Areas" or "New Interview"
    ↓
AI generates targeted questions for weak topics
    ↓
Answer → Evaluate → Track → Repeat
```

### 4.3 Payment Flow

```
Free user hits limit (3 interviews)
    ↓
"Upgrade to Pro" prompt
    ↓
Razorpay checkout (UPI/Card/Netbanking)
    ↓
Webhook confirms payment → Unlock Pro features
    ↓
Recurring billing (auto-renewal)
```

---

## 5. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Response time (question generation) | < 3 seconds |
| Response time (answer evaluation) | < 5 seconds |
| Concurrent users | 500+ |
| Uptime | 99.5% |
| Data retention | 1 year for free, unlimited for Pro |
| GDPR/privacy | Resume data encrypted at rest, deletable on request |
| Mobile responsive | Full functionality on mobile browsers |

---

## 6. Success Metrics

| Metric | Target (Month 3) | Target (Month 6) |
|--------|-------------------|-------------------|
| Registered users | 1,000 | 10,000 |
| DAU | 100 | 1,000 |
| Free → Pro conversion | 5% | 8% |
| Interview sessions/day | 300 | 3,000 |
| Average session score improvement | 15% over 5 sessions | 25% over 10 sessions |
| Churn rate (Pro) | < 15%/month | < 10%/month |
| NPS | > 40 | > 50 |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucinations in feedback | Bad advice to users | Structured prompts, output validation, human review of samples |
| High LLM API costs | Margins shrink | Use open models (Llama/Mistral) via self-hosting, cache common Q&A |
| Low conversion to paid | No revenue | Strong free tier to build habit, paywall killer features (voice, analytics) |
| Competition (Pramp, InterviewBit) | Market share | India-focused, vernacular support, cheaper pricing |
| Resume data privacy concerns | Trust issues | Transparent privacy policy, data encryption, delete-on-request |

---

## 8. Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1 — MVP | Week 1-5 | Core interview engine, auth, dashboard, basic voice |
| Phase 2 — Monetize | Week 6-10 | Payments, company-specific prep, prep plans, marketing site |
| Phase 3 — Scale | Week 11-16 | Video interviews, B2B, peer matching |
| Phase 4 — Growth | Month 5+ | Mobile app, vernacular support, partnerships |
