# UI Generation Prompt for PrepAI

Use this prompt with Google Stitch / v0 / Lovable or any AI UI tool. Copy the relevant section for each page.

---

## Tech Stack Context (Include at the top of every prompt)

```
Tech stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui components, Lucide React icons, next-themes (dark/light mode support).

Design system:
- Font: Inter (Google Fonts)
- Border radius: 10px (rounded-xl)
- Colors: Use shadcn/ui CSS variables (--primary, --secondary, --muted, --destructive, --accent, --card, --border)
- Dark mode: Full support via class="dark" on html
- Layout: Max-width containers (max-w-5xl for dashboard, max-w-7xl for coding pages)
- Components available: Button, Card, Badge, Progress, Separator, Skeleton, Tabs, Dialog, Sheet, Select, Input, Textarea, Avatar, ScrollArea, DropdownMenu

Design vibe: Modern, clean, professional SaaS. Think Linear meets LeetCode. Minimal but not boring. Generous whitespace. Subtle borders and shadows. No gradients unless for accent elements.
```

---

## PROMPT 1: Company Pipeline Selection Page (`/pipelines`)

```
Build a page where users browse company interview pipelines.

LAYOUT:
- Sticky top navbar with logo "PrepAI" on left, theme toggle + user avatar + logout on right
- Page title: "Choose Your Interview" with subtitle "Select a company to start their real hiring pipeline"
- Below: 2x3 grid of company cards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)

COMPANY CARDS (6 total: Google, Amazon, Meta, Microsoft, Flipkart, Razorpay):
- Each card is ~280px wide, has:
  - Company logo/icon at top (use a colored circle with first letter as placeholder, e.g., "G" in Google blue, "A" in Amazon orange)
  - Company name (bold, lg)
  - Role name below (muted text, e.g., "L3 Software Engineer")
  - Small info row: "6 rounds · ~5 hours total"
  - Round type pills/badges in a row: "OA" "Coding" "Coding" "System Design" "Behavioral" (use small colored badges, different colors per type)
  - Hover: subtle scale + shadow lift
  - Click: navigates to company detail

BOTTOM: A muted text: "More companies coming soon — Amazon, Flipkart pipelines launching next week"

COLOR CODING for round types:
- OA: blue badge
- Coding: green badge
- System Design: purple badge
- Behavioral: orange badge
- Phone Screen: teal badge

Include dark mode support. The page should feel like browsing a catalog, inviting and clean.
```

---

## PROMPT 2: Pipeline Detail + Start Page (`/pipelines/[company]`)

```
Build a pipeline detail page for a specific company interview.

HEADER:
- Back arrow link to "/pipelines"
- Large company name "Google" with role "L3 Software Engineer" below
- Description text: "Google's standard L3 interview loop — 6 rounds covering coding, system design, and behavioral skills"

PIPELINE VISUALIZATION (the hero section):
- Horizontal timeline/stepper showing all 6 rounds connected by lines
- Each round is a node on the timeline:
  - Circle with round number (1-6)
  - Round name below: "Online Assessment", "Phone Screen", "Coding 1", "Coding 2", "System Design", "Googleyness"
  - Type badge below name (colored: OA=blue, Coding=green, etc.)
  - Duration: "90 min", "45 min" etc in muted text
- On mobile: convert to vertical stepper
- Lines connecting the nodes should have a subtle dashed style

ROUND DETAILS (below timeline):
- Expandable cards or a list showing each round with:
  - Round name + type badge + duration
  - Description text (e.g., "Two medium-hard coding problems, timed. Tests your problem-solving speed.")
  - Number of questions
  - Passing score requirement (e.g., "Minimum 6/10 to advance")

START SECTION (bottom, sticky or prominent):
- Card with:
  - Text: "Ready to start your Google interview?"
  - Two input fields: Resume upload (file dropzone) + Job description (textarea)
  - Large primary button: "Start Pipeline" with a rocket or play icon
  - Muted text: "You'll progress through each round. Pass to advance, fail to retry."

Dark mode support. Feel professional and slightly intense — this is a real interview simulation.
```

---

## PROMPT 3: Pipeline Overview / Round Stepper (`/pipeline/[attemptId]`)

```
Build a pipeline progress page showing the user's journey through interview rounds.

HEADER:
- "Google L3 Software Engineer" title
- Progress indicator: "Round 3 of 6" with a thin progress bar

VERTICAL STEPPER (main content):
- Full-height vertical stepper with 6 rounds, each round is a card-like row:

  COMPLETED/PASSED rounds:
  - Green check circle icon on left
  - Round name + type badge
  - Score displayed: "7.5/10" in green
  - "Passed" badge in green
  - Collapsed by default, expandable to show brief feedback
  - Muted/dimmed slightly

  CURRENT/AVAILABLE round:
  - Pulsing blue circle icon on left
  - Round name + type badge (prominent, not muted)
  - "Start Round" primary button on the right
  - Description text visible
  - Duration + question count info
  - This row should be visually highlighted (subtle blue left border or blue background tint)

  LOCKED/FUTURE rounds:
  - Grey lock icon on left
  - Round name + type badge (muted text)
  - "Locked" in muted text
  - No interaction possible

  FAILED round:
  - Red X circle icon on left
  - Score in red: "4.2/10"
  - "Failed" badge in red
  - "Pipeline ended" message
  - "Retry Pipeline" destructive button

SIDEBAR or BOTTOM STATS:
- Overall pipeline status
- Time spent so far
- Average score across completed rounds

Dark mode support. The stepper should feel like a game progress screen — satisfying to see green checks, motivating to continue.
```

---

## PROMPT 4: Active Coding Round — Split Pane (MOST IMPORTANT PAGE)

```
Build the main coding interview page with a split-pane layout and AI interviewer chat.

This is a coding interview simulation. Three-panel layout on desktop:

LEFT PANEL (50% width, split vertically):

  TOP HALF — Problem Description:
  - Round info bar: "Google · Onsite: Coding 1 · 45 min" with a countdown timer "42:30" on the right (timer in a pill badge, turns red under 5 min)
  - Problem title: "Two Sum" (bold, lg)
  - Difficulty badge: "Medium" (yellow)
  - Topic badge: "Arrays & Hashing" (muted)
  - Problem description text (scrollable, monospace-friendly for code examples)
  - Collapsible "Sample Test Cases" section:
    - Each test case in a muted code block:
      Input: nums = [2,7,11,15], target = 9
      Expected: [0,1]
  - A drag handle or resize bar between problem and editor

  BOTTOM HALF — Code Editor:
  - Language selector dropdown in top-right of editor area (C++, JavaScript, Python, Go, Java)
  - Full CodeMirror editor area with:
    - Syntax highlighting matching selected language
    - Line numbers
    - Dark theme matching app theme
    - Pre-filled with starter code template
  - Below editor: "Submit Solution" primary button (full width of left panel)

RIGHT PANEL (35% width) — AI Interviewer Chat:

  HEADER:
  - "AI Interviewer" title with a small bot/brain icon
  - Company badge: "Google"
  - Interaction counter: "3/20 interactions" in muted text

  CHAT AREA (scrollable, takes most of the space):
  - Message bubbles:
    - Interviewer messages: Left-aligned, muted background (card color), with small bot avatar
    - Candidate messages: Right-aligned, primary color background, white text
  - First message (auto): "Hi! I'm your Google interviewer today. Take a moment to read the problem, then walk me through your initial approach before you start coding."
  - Streaming indicator: When AI is responding, show "Interviewer is thinking..." with a pulsing dots animation
  - Messages should auto-scroll to bottom

  INPUT AREA (bottom, sticky):
  - Text input: "Explain your approach or ask a question..."
  - Send button (icon only, arrow-up)
  - Muted text below: "The interviewer observes your code automatically"

DIVIDER between left and right panels:
- Draggable resize handle (vertical bar with grip dots)

MOBILE LAYOUT:
- Tabs instead of split pane: "Problem" | "Code" | "Interviewer"
- Swipeable between tabs

BOTTOM BAR (full width, below both panels):
- "Submit Solution" button (if not in left panel)
- Timer
- "End Round" ghost button

Design this to feel like a real coding interview. The AI chat should feel natural, like Slack or iMessage. The code editor should be the focus — large and prominent. The problem description is reference material. Dark mode is critical here — most coders prefer dark theme.

Important: The layout should feel like a professional IDE (think VS Code's panel layout) but cleaner and more focused.
```

---

## PROMPT 5: Round Result / Transition Screen

```
Build a round completion screen shown after submitting a coding solution.

TWO VARIANTS:

VARIANT A — PASSED:
- Large green check circle animation (subtle scale-in animation)
- "Round Passed!" in large bold text
- Score: "7.5/10" in large green text
- Score breakdown as horizontal bars:
  - Correctness: 8/10
  - Efficiency: 7/10
  - Code Quality: 8/10
  - Edge Cases: 7/10
- Brief feedback in a card: "Strong solution using a hash map. Good time complexity analysis. Consider handling the empty array edge case."
- Complexity analysis in a small card:
  - "Your solution: O(n) time, O(n) space"
  - "Optimal: O(n) time, O(n) space ✓"
- Primary button: "Continue to Next Round →" (large)
- Muted text showing what's next: "Next: Onsite Coding 2 · 45 min · 1 hard problem"

VARIANT B — FAILED:
- Large red X circle (subtle animation)
- "Round Not Passed" in large text (not aggressive, supportive tone)
- Score: "4.2/10" in red
- Same score breakdown but in red/yellow
- Feedback card with constructive feedback
- Tips section with 3 bullet points
- "Optimized Solution" expandable section showing the ideal code
- Two buttons:
  - "Retry Full Pipeline" (primary) — starts fresh
  - "Review All Rounds" (outline) — goes to result page
- Encouraging text: "Don't worry — this is practice. Review the feedback and try again."

Both variants should feel like a game checkpoint. The pass variant should be satisfying and motivating. The fail variant should be supportive, not discouraging.
```

---

## PROMPT 6: Pipeline Final Result Page

```
Build the final results page after completing (or failing) an entire interview pipeline.

HEADER:
- "Google L3 Software Engineer — Interview Complete"
- Large result badge:
  - If passed all rounds: Green "HIRED" badge with confetti-style subtle decoration
  - If failed: Red "NOT SELECTED" badge but with supportive messaging

OVERALL STATS (3-column card grid):
- Overall Score: "7.2/10" (color-coded)
- Rounds Passed: "5/6"
- Total Time: "4h 23m"

ROUND-BY-ROUND BREAKDOWN:
- Vertical list of all rounds, each as an expandable card:
  - Round name + type badge + pass/fail badge + score
  - Expanded: shows question(s), user's answer/code, AI feedback, scores
  - For coding rounds: show the submitted code in a syntax-highlighted block
  - For behavioral rounds: show the text answer

STRENGTHS & WEAKNESSES (AI-generated summary):
- Card with two columns:
  - Left: "Strengths" with green bullet points
  - Right: "Areas to Improve" with orange bullet points

ACTION BUTTONS:
- "Retry This Pipeline" (primary)
- "Try Another Company" (secondary)
- "Back to Dashboard" (ghost)
- "Share Results" (outline, optional)

Dark mode support. If the user passed, this should feel celebratory. If they failed, it should feel constructive and motivating to retry.
```

---

## PROMPT 7: Updated Dashboard

```
Build an updated dashboard for a user who has pipeline-based interviews.

HEADER:
- "Hey, Rahul" greeting
- Subtle subtitle: "Your interview journey"

ACTIVE PIPELINES section (top, most prominent):
- Horizontal scrollable cards (or 2-column grid):
  - Each card shows:
    - Company logo placeholder + company name
    - Role: "L3 Software Engineer"
    - Progress: "Round 3 of 6" with a mini progress bar
    - Current round name: "Onsite: Coding 1"
    - "Continue" primary button
    - Time since last activity: "Started 2 days ago"
  - If no active pipelines: CTA card "Start your first pipeline →" linking to /pipelines

STATS ROW (3 cards):
- Pipelines Completed: "3"
- Average Score: "7.2/10"
- Rounds Cleared: "14/18"

RECENT RESULTS section:
- List of completed pipeline attempts:
  - Company + role + date
  - Pass/fail badge + overall score
  - Click to view full result
  - Newest first

QUICK START section (bottom):
- "Try a new company" with small company icon buttons (Google, Amazon, Meta...) that link to /pipelines

Dark mode. The dashboard should feel like a progress tracker / game hub. Active pipelines are the hero — the user should immediately see where to pick up.
```

---

## General Notes for All Prompts

- Use `cn()` utility for conditional classNames (clsx + tailwind-merge pattern)
- All components should be React Server Components by default, add `'use client'` only when needed (interactivity, state, effects)
- Use shadcn/ui component imports: `@/components/ui/button`, `@/components/ui/card`, etc.
- Icons from `lucide-react`
- Use `next/link` for navigation, `next/navigation` for `useRouter`/`useParams`
- Loading states: use `<Skeleton />` components matching the layout
- All pages need mobile responsive layouts (stack vertically on small screens)
- The split-pane coding page is the most critical — spend the most effort there
