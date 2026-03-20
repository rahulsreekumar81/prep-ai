# PrepAI — UI Design System
> Single source of truth for all visual decisions. Every color, spacing, radius, and shadow used in the codebase must reference this doc.

---

## User Flow (8 Screens)

```
Login/Signup
    ↓
1. Dashboard          ← /dashboard
    ↓ (click "Try a new company" or nav)
2. Choose Interview   ← /pipelines
    ↓ (click company card)
3. Pipeline Detail    ← /pipelines/[company]  (resume upload + START PIPELINE)
    ↓ (click START PIPELINE)
4. Pipeline Explorer  ← /pipeline/[attemptId]  (stepper + stats sidebar)
    ↓ (click "Start Round")
    ├─ DSA/Coding round  → 5a. CodeRound IDE   ← /pipeline/[attemptId]/round/[roundId]
    └─ Behavioral round  → 5b. Interview Session ← /pipeline/[attemptId]/round/[roundId]
         ↓ (submit)
6. Round Results      ← modal overlay on top of pipeline explorer
    ↓ (all rounds done)
7. Pipeline Final Result ← /pipeline/[attemptId]/result
```

---

## Color Tokens

### Backgrounds (layered dark system)
```
--bg-base:        #0D0F14   /* page background — outermost layer */
--bg-surface:     #141720   /* sidebar, secondary areas */
--bg-card:        #161B26   /* card backgrounds */
--bg-card-hover:  #1C2235   /* card on hover */
--bg-elevated:    #1E2640   /* modals, dropdowns, popovers */
--bg-input:       #0F1219   /* form inputs, code areas */
```

### Primary Blue (main interactive color)
```
--blue-primary:   #2563EB   /* primary buttons, active sidebar, progress fills */
--blue-hover:     #1D4ED8   /* button hover state */
--blue-muted:     #1E3A5F   /* blue backgrounds (e.g. active round card tint) */
--blue-subtle:    #172554   /* very faint blue tint on cards */
--blue-text:      #60A5FA   /* blue text links, score labels, live indicators */
```

### Semantic Colors
```
/* Success */
--green-primary:  #22C55E   /* pass badges, checkmarks, strengths bullets */
--green-muted:    #14532D   /* success card backgrounds */
--green-text:     #4ADE80   /* "PASS" text, green badge text */

/* Error */
--red-primary:    #EF4444   /* fail state, error X icon, "End Round" button */
--red-muted:      #450A0A   /* failed round card background */
--red-text:       #F87171   /* "FAIL" text label */

/* Warning / Edge Cases */
--amber-primary:  #F59E0B   /* timer, edge cases progress bar */
--amber-text:     #FCD34D   /* warning text */

/* Areas for Improvement */
--orange-primary: #F97316   /* growth areas bullets, "Areas for Improvement" label */
--orange-text:    #FB923C   /* orange label text */
```

### Round Type Badge Colors
```
--badge-oa:               #3B82F6  bg / #DBEAFE  text  (blue)
--badge-coding:           #10B981  bg / #D1FAE5  text  (green)
--badge-system-design:    #8B5CF6  bg / #EDE9FE  text  (purple)
--badge-behavioral:       #F97316  bg / #FFEDD5  text  (orange)
--badge-phone-screen:     #06B6D4  bg / #CFFAFE  text  (cyan)
--badge-technical:        #06B6D4  bg / #CFFAFE  text  (cyan — same as phone screen)
--badge-architecture:     #22C55E  bg / #DCFCE7  text  (green)
```
> All badges use dark semi-transparent backgrounds in dark mode: `rgba(color, 0.15)` bg + full color text

### Text
```
--text-primary:   #FFFFFF   /* headings, active nav labels, key numbers */
--text-secondary: #94A3B8   /* body text, descriptions, subtitles */
--text-muted:     #64748B   /* captions, timestamps, placeholder */
--text-disabled:  #334155   /* locked state labels */
--text-inverse:   #0D0F14   /* text on light backgrounds (START PIPELINE btn) */
```

### Borders
```
--border-default:  #1E2535   /* card borders, section separators */
--border-subtle:   #151C2E   /* very faint, used inside cards */
--border-active:   #2563EB   /* active/focused element border (blue glow) */
--border-success:  #22C55E   /* passed round border */
--border-error:    #EF4444   /* failed round border */
```

---

## Typography

### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

### Scale
| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-hero` | 48px | 800 | 1.1 | "Choose Your Interview" page title |
| `text-page` | 36px | 700 | 1.2 | "Hey, Rahul" dashboard greeting |
| `text-title` | 28px | 700 | 1.3 | "Google L3 - Interview Complete" |
| `text-heading` | 22px | 700 | 1.4 | Section headings, question text |
| `text-subheading` | 18px | 600 | 1.4 | Card titles, company names |
| `text-body-lg` | 16px | 400 | 1.6 | Primary body copy |
| `text-body` | 14px | 400 | 1.6 | Default body text |
| `text-small` | 13px | 400 | 1.5 | Descriptions, feedback text |
| `text-caption` | 12px | 500 | 1.4 | Labels, metadata |
| `text-label` | 11px | 600 | 1.3 | Uppercase micro labels ("BEHAVIORAL", "ACTIVE ROUND") |
| `text-code` | 13px | 400 | 1.7 | Monospace code, syntax highlighted |

### Label Convention
Uppercase labels like "QUESTION 2 OF 5 · BEHAVIORAL", "ACTIVE ROUND", "PIPELINE DETAIL" use:
- `font-size: 11px`, `font-weight: 600`, `letter-spacing: 0.08em`, `text-transform: uppercase`
- Color: `--blue-text` (#60A5FA) for contextual labels, `--text-muted` for structural labels

---

## Border Radius

```
--radius-sm:    6px    /* badges, small pills, tags */
--radius-md:    8px    /* buttons, inputs, small cards */
--radius-lg:    12px   /* standard cards, panels */
--radius-xl:    16px   /* large cards, pipeline cards, modals */
--radius-2xl:   20px   /* "Ready to Begin?" CTA panel */
--radius-full:  9999px /* round badges, pill tags, avatar circles */
--radius-circle: 50%   /* round number circles in stepper, avatar */
```

---

## Shadows & Glows

```css
/* Standard card shadow */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);

/* Elevated modal/popover shadow */
--shadow-elevated: 0 10px 40px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4);

/* Active/focused blue glow (active round card, focused inputs) */
--shadow-blue-glow: 0 0 0 1px #2563EB, 0 0 12px rgba(37, 99, 235, 0.25);

/* Success glow (passed round) */
--shadow-green-glow: 0 0 0 1px #22C55E, 0 0 8px rgba(34, 197, 94, 0.15);

/* Error glow (failed round) */
--shadow-red-glow: 0 0 0 1px #EF4444, 0 0 8px rgba(239, 68, 68, 0.15);
```

---

## Spacing Scale

Uses 4px base unit throughout.
```
4px   xs     tight gaps, icon padding
8px   sm     inner component padding, badge padding
12px  md     card inner padding (compact)
16px  lg     standard spacing, section gaps
20px  xl     card padding
24px  2xl    section padding, content gaps
32px  3xl    large section separation
48px  4xl    hero sections, page-level padding
```

---

## Layout & Grid

### Sidebar Layout (ALL authenticated pages except round sessions)
```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (240px)  │  Main Content Area (flex-1)          │
│ ──────────────── │ ──────────────────────────────────── │
│ Logo             │  <page content>                      │
│ Nav items        │  max-width: none (full flex)         │
│ ...              │  padding: 32px                       │
│ [Pro Plan card]  │                                      │
└─────────────────────────────────────────────────────────┘
```

### Sidebar Structure
- Width: `240px` (collapsed: `64px`)
- Background: `--bg-surface` (#141720)
- Border-right: `1px solid --border-default`
- Items: icon (20px) + label, padding `12px 16px`, radius `8px`
- Active item: `--blue-primary` background, white text
- Inactive item: `--text-secondary` text, hover → `--bg-card`
- Bottom: "PRO PLAN" upgrade card (blue border, `Manage` button)
- Nav items: Dashboard, Interviews, Resources, Analytics

### Navbar (CodeRound IDE and Interview Session — full-screen pages)
- Top bar only, no sidebar
- Height: `56px`, background: `--bg-base`
- Border-bottom: `1px solid --border-default`

### Content Max-Width by Page
- Dashboard: `max-w-[1100px]`
- Pipelines grid: `max-w-[900px]`
- Pipeline detail: `max-w-[960px]`
- Pipeline explorer: full width, two-column (`flex`)
- CodeRound IDE: full screen, no max-width
- Round results: modal `max-w-[640px]`
- Final result: `max-w-[860px]`

---

## Components

### Buttons
```
Primary:    bg --blue-primary, text white, radius --radius-md
            hover: --blue-hover, transition 150ms
            padding: 10px 20px, font 14px weight 600

Secondary:  bg --bg-card, text --text-secondary, border --border-default
            hover: --bg-card-hover

Destructive: bg --red-primary, text white (e.g. "End Round", "End Session")

Ghost:      transparent bg, text --text-secondary, border transparent
            hover: --bg-card

Pill/large: radius --radius-full (e.g. "Continue Prep" button on pipeline cards)

Icon only:  40px × 40px, radius --radius-md
```

### Cards
```
Standard card:
  background: --bg-card
  border: 1px solid --border-default
  border-radius: --radius-lg (12px)
  padding: 20px

Pipeline card (dashboard):
  Has background image with gradient overlay
  gradient: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7))
  border-radius: --radius-xl (16px)
  overflow: hidden

Active round card:
  border: 1px solid --blue-primary
  background: --blue-muted (rgba(37,99,235,0.12))
  box-shadow: --shadow-blue-glow

Failed round card:
  border: 1px solid --red-primary
  background: rgba(239,68,68,0.08)
```

### Badges / Round Type Pills
```
Structure: px-2 py-0.5, radius --radius-full (pill)
Font: 11px, weight 600
All use: background rgba(color, 0.15), text: full color
```

### Progress Bars
```
Track:  background --border-default, height 4px, radius --radius-full
Fill:
  - Default / blue:    --blue-primary
  - Success / green:   --green-primary
  - Warning / amber:   --amber-primary
  - Danger / red:      --red-primary
```

### Round Stepper (Pipeline Explorer)
```
Vertical line: 2px dashed --border-default connecting nodes
Node states:
  - Completed: green filled circle (32px), white checkmark icon
  - Active:    blue filled circle (32px), blue play icon, pulsing animation
  - Failed:    red filled circle (32px), white X icon
  - Locked:    dark circle (32px), lock icon, --text-disabled
```

### Company Letter Avatars
```
Size: 40px circle
Colors per company:
  Google (G):    blue   #4285F4
  Amazon (A):    amber  #FF9900
  Meta (M):      indigo #0866FF
  Microsoft (M): teal   #00A4EF
  Flipkart (F):  orange #F7941D
  Razorpay (R):  blue   #3395FF
  Netflix (N):   red    #E50914
  Airbnb (A):    coral  #FF5A5F
```

### Stat Cards (Dashboard metrics)
```
Icon: 40px circle, semi-transparent bg matching icon color
Label: --text-muted, 11px uppercase
Value: 28px bold white
Sub-label: --text-secondary 12px (e.g. "/ 10")
```

### Code Editor Area
```
Background: --bg-input (#0F1219)
Font: --font-mono, 13px
Line numbers: --text-muted
Current line highlight: rgba(255,255,255,0.03)
Syntax theme: custom dark — matches overall palette
  keywords:    #60A5FA (blue)
  strings:     #4ADE80 (green)
  numbers:     #F59E0B (amber)
  comments:    #475569 (slate)
  functions:   #C084FC (purple)
```

### Chat Bubbles (AI Interviewer)
```
AI message:   bg --bg-card, text --text-secondary, radius 12px 12px 12px 4px
User message: bg --blue-primary, text white, radius 12px 12px 4px 12px
Thinking:     animated dots, --text-muted
```

### Score / Performance Bars (Round Results)
```
Correctness: green   #22C55E
Efficiency:  blue    #3B82F6
Code Quality: blue   #3B82F6
Edge Cases:  amber   #F59E0B
```

---

## Iconography

- Icon library: **Lucide React** (consistent with existing codebase)
- Default icon size: `16px` (inline), `20px` (standalone/nav)
- Nav icons: `20px`
- Status icons: `24px` (checkmark, X, lock in stepper)

---

## Animation & Motion

```
Transition default: 150ms ease
Hover scale (pipeline cards): scale(1.02), transition 200ms
Active sidebar item: instant (no transition)
Round stepper connecting line: appears on completion
Thinking dots: bounce animation, 300ms stagger
Progress bar fill: width transition 600ms ease-out
```

---

## Dark Mode

**This app is dark-mode only.** There is no light mode. The entire design system assumes dark backgrounds. Do NOT add light mode variants. The `class="dark"` on `<html>` should be locked.

---

## Tailwind Config Mapping

```js
// tailwind.config.js additions needed:
theme: {
  extend: {
    colors: {
      bg: {
        base:    '#0D0F14',
        surface: '#141720',
        card:    '#161B26',
        elevated:'#1E2640',
        input:   '#0F1219',
      },
      border: {
        DEFAULT: '#1E2535',
        subtle:  '#151C2E',
        active:  '#2563EB',
      },
      // Use Tailwind's built-in blue-600, green-500, red-500, amber-500 for semantic colors
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    borderRadius: {
      sm: '6px',
      DEFAULT: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
    },
    boxShadow: {
      card:       '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      elevated:   '0 10px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
      'blue-glow':'0 0 0 1px #2563EB, 0 0 12px rgba(37,99,235,0.25)',
      'green-glow':'0 0 0 1px #22C55E, 0 0 8px rgba(34,197,94,0.15)',
      'red-glow':  '0 0 0 1px #EF4444, 0 0 8px rgba(239,68,68,0.15)',
    },
  }
}
```

---

## Page-by-Page Component Inventory

### 1. Dashboard (`/dashboard`)
- Sidebar (persistent)
- Greeting header with subtitle
- 3× Stat cards (Pipelines Completed, Avg Score, Rounds Cleared)
- "Active Pipelines" section header + "View All" link
- 3× Pipeline cards (image bg, company name, role, round progress bar, CTA button)
- "Recent Results" list (company, time, category, PASS/FAIL badge, score)
- "Try a new company" grid (6× icon buttons)
- Pro Plan upgrade card (sidebar bottom)

### 2. Choose Interview (`/pipelines`)
- Simple top navbar (no sidebar on this page — full-width centered layout)
- Hero text block ("Choose Your Interview")
- 3×2 grid of company cards (avatar, name, role, rounds info, type badges)
- Bottom notice text

### 3. Pipeline Detail (`/pipelines/[company]`)
- Back breadcrumb ("← PIPELINE DETAIL")
- Company name + role + location + status badges
- "Process Roadmap" horizontal stepper (6 numbered circles)
- "Round Requirements" card grid (5 cards with icons, names, descriptions, required score badge)
- "Application Materials" — resume dropzone + job description textarea
- "Ready to Begin?" CTA panel (solid blue bg, feature checklist, START PIPELINE button)

### 4. Pipeline Explorer (`/pipeline/[attemptId]`)
- Top navbar (no sidebar — layout change here)
- Left content: title, progress bar, vertical round stepper
- Right sidebar: Pipeline Statistics card, Interviewer Feedback, Preparation tips

### 5a. CodeRound IDE (`/pipeline/[attemptId]/round/[roundId]` — coding)
- Custom full-screen navbar: logo, timer (amber), tab nav (Problem | Editor | Interview), avatar
- Left pane: problem description (with formatted examples), code editor (language selector, reset btn, full-screen btn)
- Right pane: AI Interviewer chat (avatar, LIVE FEEDBACK badge, message bubbles, input)
- Bottom bar: Run Tests, Submit Solution (blue), End Round (red), session status

### 5b. Interview Session (`/pipeline/[attemptId]/round/[roundId]` — behavioral)
- Full-screen navbar: logo, timer, "End Session" button
- Left: question label (uppercase, blue), question text (large bold), answer textarea, voice/dictation buttons, Submit Answer
- Right: Current Insights panel (real-time feedback items), AI Feedback panel (Strengths + Areas for Improvement + quote card)
- Bottom status bar: keyboard mode, microphone status, session ID

### 6. Round Results (modal)
- Modal overlay on dark backdrop
- Close button (top right)
- Success/fail icon (large circle)
- "Round Passed!" / "Round Not Passed" heading
- Score in blue
- Two-column: Performance Stats (4 bars) + AI Feedback (text + complexity analysis)
- "Continue to Next Round →" button (full width blue)
- Achievement unlock text
- 3× bottom stat chips (Latency, Memory, Ranking)

### 7. Pipeline Final Result (`/pipeline/[attemptId]/result`)
- Top navbar (Dashboard | History | Resources links)
- "PIPELINE FINAL RESULT" label
- Large title
- HIRED / NOT SELECTED badge (prominent, centered)
- 3× Metric cards (Overall Score with progress, Rounds Passed, Total Time)
- Key Strengths + Growth Areas (two-column)
- "Round-by-Round Breakdown" expandable list
- 3× Action buttons (Back to Dashboard, Try Another Company, Retry Pipeline)
- Footer

---

## Open Questions Before Implementation

1. **Pipelines page layout**: Screenshots 1 and 2 show the Choose Interview page without a sidebar (full-width centered layout). Is this intentional — no sidebar on `/pipelines`? Or should sidebar be present?

2. **Round Results**: Screenshot 7 appears to be a modal overlay (dark dimmed background visible). Should this be a modal on top of the pipeline explorer, or navigate to a separate page?

3. **Sidebar nav items**: "Interviews", "Resources", "Analytics" — are these functional routes or placeholder for now? Should "Interviews" link to the old flat interview flow or the pipelines list?

4. **CodeRound IDE tabs**: "Problem | Editor | Interview" in the top bar — on desktop, is this a split pane (all visible) with the tabs only activating on mobile? Or is it always tabbed even on desktop?

5. **Company cards on dashboard**: The active pipeline cards have photo backgrounds (Google office photo, etc.) — should we use placeholder gradients or are there actual images?
