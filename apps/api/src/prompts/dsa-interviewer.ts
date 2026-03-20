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

/**
 * Analyze the candidate's code and return observations to feed to the interviewer.
 * This pre-analysis ensures the LLM doesn't have to infer patterns itself — we tell it
 * exactly what we're seeing so responses are targeted and relevant.
 */
function analyzeCode(code: string): string {
  if (!code.trim()) return 'CODE_STATE: empty'

  const lines = code.split('\n')
  const observations: string[] = []

  // Detect nested loops → O(n²) or worse
  const loopKeywords = /\b(for|while)\b/
  let loopDepth = 0
  let maxLoopDepth = 0
  for (const line of lines) {
    if (loopKeywords.test(line)) loopDepth++
    if (/^\s*(})/.test(line)) loopDepth = Math.max(0, loopDepth - 1)
    maxLoopDepth = Math.max(maxLoopDepth, loopDepth)
  }
  if (maxLoopDepth >= 2) {
    observations.push(`NESTED_LOOPS_DETECTED: ${maxLoopDepth} levels deep — likely O(n²) or worse time complexity`)
  }

  // Detect hash map / set usage → good pattern
  const usesHashMap = /\b(HashMap|HashSet|Map|Set|dict|{}\s*$|defaultdict|Counter)\b/.test(code)
  if (usesHashMap) observations.push('USES_HASH_STRUCTURE: candidate is using a hash map/set — good O(1) lookup pattern')

  // Detect brute force: linear search without data structure
  const hasLinearSearch = /indexOf|\.find\(|\.includes\(|in range\(/.test(code) && !usesHashMap
  if (hasLinearSearch) observations.push('LINEAR_SEARCH_WITHOUT_HASH: scanning array linearly when a hash map could give O(1) lookup')

  // Detect sorting
  const usesSorting = /\.sort\(|sorted\(/.test(code)
  if (usesSorting) observations.push('USES_SORTING: O(n log n) operation present')

  // Detect two-pointer pattern
  const usesTwoPointers = /left\s*[,=]|right\s*[,=]|lo\s*[,=]|hi\s*[,=]/.test(code) && loopKeywords.test(code)
  if (usesTwoPointers) observations.push('TWO_POINTER_PATTERN: candidate appears to be using two-pointer technique')

  // Detect binary search
  const usesBinarySearch = /mid\s*=|\/\/\s*2|>> 1|bisect/.test(code)
  if (usesBinarySearch) observations.push('BINARY_SEARCH_PATTERN: candidate appears to be using binary search O(log n)')

  // Detect recursion / DFS / BFS
  const usesRecursion = /\bself\s*\.\s*\w+\s*\(|\bthis\s*\.\s*\w+\s*\(/.test(code)
  const usesDFS = /dfs|depth.first|stack\.push|stack\.append/.test(code.toLowerCase())
  const usesBFS = /bfs|breadth.first|queue|deque/.test(code.toLowerCase())
  if (usesRecursion || usesDFS) observations.push('RECURSIVE_OR_DFS_APPROACH: recursive or stack-based traversal detected')
  if (usesBFS) observations.push('BFS_APPROACH: queue-based traversal detected')

  // Detect DP pattern
  const usesDP = /dp\[|memo|lru_cache|@cache|\.memo/.test(code)
  if (usesDP) observations.push('DYNAMIC_PROGRAMMING: memoization or DP array detected')

  // Detect missing edge case handling
  const hasEdgeCaseCheck = /if.*len\s*==\s*0|if.*null|if.*None|if.*empty|\.length\s*===?\s*0/.test(code)
  if (!hasEdgeCaseCheck && code.length > 50) {
    observations.push('NO_EDGE_CASE_GUARD: no null/empty input check detected')
  }

  // Estimate solution completeness
  const hasReturn = /\breturn\b/.test(code)
  const codeLength = code.replace(/\s+/g, ' ').trim().length
  if (!hasReturn) {
    observations.push('NO_RETURN_STATEMENT: solution appears incomplete — no return statement')
  } else if (codeLength < 80) {
    observations.push('VERY_SHORT_SOLUTION: code is very short — may be incomplete or elegantly simple')
  } else {
    observations.push('SOLUTION_HAS_RETURN: candidate has written a substantial solution with a return statement')
  }

  return observations.length > 0 ? observations.join('\n') : 'STANDARD_CODE: no notable patterns detected'
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

  const codeAnalysis = analyzeCode(currentCode)

  const codeSection = currentCode.trim()
    ? `CANDIDATE'S CURRENT CODE:\n\`\`\`\n${currentCode.slice(0, 3000)}\n\`\`\`\n\nCODE ANALYSIS (use this to guide your response):\n${codeAnalysis}`
    : "CANDIDATE'S CODE: empty — they haven't started coding yet"

  const testCasesText =
    testCases.length > 0
      ? testCases.map((tc) => `  Input: ${tc.input} → Expected: ${tc.expected}`).join('\n')
      : '  (none provided)'

  return `You are a senior software engineer at ${company} conducting the "${roundName}" interview.

PROBLEM: ${problemTitle}
${problemContent}

TEST CASES:
${testCasesText}

CONVERSATION SO FAR (last 6 messages):
${historyText}

${codeSection}

INTERACTIONS USED: ${interactionCount}/${maxInteractions}

YOUR ROLE — Read the CODE ANALYSIS above and respond based on what you actually see:

IF CODE_STATE IS empty:
→ Ask them to explain their approach before writing code. "Before you start coding, walk me through how you'd approach this."

IF NESTED_LOOPS_DETECTED:
→ Don't point it out directly. Ask: "What's the time complexity of your current solution?" If they say O(n²), ask "Can we do better? What data structure might help us avoid that inner loop?"

IF LINEAR_SEARCH_WITHOUT_HASH:
→ "You're doing a linear scan here — what's the cost of that per operation? Is there a data structure that gives you this lookup in O(1)?"

IF USES_HASH_STRUCTURE (and no nested loops):
→ Acknowledge the approach. "Good choice using a hash map here. What's the space complexity tradeoff you're making?"

IF NO_RETURN_STATEMENT:
→ "It looks like your solution isn't returning anything yet — what should this function return?"

IF NO_EDGE_CASE_GUARD:
→ "Before we finalize this, what happens if the input array is empty? Or if there are duplicate values?"

IF SOLUTION_HAS_RETURN and USES_HASH_STRUCTURE and no nested loops:
→ "This looks like a solid approach. Walk me through the time and space complexity. Can you think of any edge cases we haven't handled?"

IF USES_SORTING:
→ "You're sorting here — that's O(n log n). Could we solve this in O(n) without sorting?"

IF BINARY_SEARCH_PATTERN or TWO_POINTER_PATTERN:
→ Acknowledge: "Good thinking with the two-pointer/binary search approach. Why does this work here? What property of the array are you relying on?"

IF DYNAMIC_PROGRAMMING:
→ "Looks like you're taking a DP approach. What's your recurrence relation here?"

ABSOLUTE RULES:
- NEVER write code or give away the answer
- Keep responses to 2-3 sentences max
- Sound like a real interviewer, not a tutorial
- Be direct and specific to what you see in the code — don't ask generic questions
- One question or prompt at a time — don't stack multiple questions

Respond with ONLY your spoken words.`
}
