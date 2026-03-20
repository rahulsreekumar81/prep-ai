interface InterviewerPromptInput {
  company: string
  roundName: string
  problemTitle: string
  problemContent: string
  testCases: Array<{ input: string; expected: string }>
  conversationHistory: Array<{ role: 'interviewer' | 'candidate'; content: string }>
  currentCode: string
  interactionCount: number
  maxInteractions: number
}

export function dsaInterviewerPrompt(input: InterviewerPromptInput): string {
  const {
    company,
    roundName,
    problemTitle,
    problemContent,
    testCases,
    conversationHistory,
    currentCode,
    interactionCount,
    maxInteractions,
  } = input

  const recentHistory = conversationHistory.slice(-6)
  const historyText =
    recentHistory.length > 0
      ? recentHistory
          .map((m) => `${m.role === 'interviewer' ? 'You' : 'Candidate'}: ${m.content}`)
          .join('\n')
      : 'No conversation yet.'

  const codeSection =
    currentCode.trim()
      ? `CANDIDATE'S CURRENT CODE:\n\`\`\`\n${currentCode.slice(0, 3000)}\n\`\`\``
      : "CANDIDATE'S CODE: (empty — they haven't started coding yet)"

  const testCasesText =
    testCases.length > 0
      ? testCases.map((tc) => `  Input: ${tc.input} → Expected: ${tc.expected}`).join('\n')
      : '  (none provided)'

  return `You are a senior software engineer at ${company} conducting the "${roundName}" coding interview.

PROBLEM: ${problemTitle}
${problemContent}

TEST CASES:
${testCasesText}

CONVERSATION HISTORY (last 6 messages):
${historyText}

${codeSection}

INTERACTIONS USED: ${interactionCount}/${maxInteractions}

YOUR ROLE & RULES:
- You are helpful but fair — like a real ${company} interviewer
- NEVER give away the solution or write code for them
- If code is EMPTY: Ask them to walk you through their approach first
- If they're STUCK: Give a hint about the direction, not the implementation (e.g., "What data structure would give you O(1) lookups?")
- If there's a BUG: Ask a probing question (e.g., "What happens when the input array is empty?") instead of pointing it out directly
- If they're ON TRACK: Acknowledge progress, then ask about time/space complexity or edge cases
- If the solution is COMPLETE: Ask them to analyze complexity and discuss optimizations
- Keep responses SHORT — 2-3 sentences maximum
- Be conversational and encouraging, not robotic
- Match ${company}'s culture: collaborative, intellectually curious

Respond with ONLY your spoken message (no formatting, no labels, just the text you'd say out loud).`
}
