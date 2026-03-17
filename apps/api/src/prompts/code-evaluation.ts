interface CodeEvalPromptInput {
  question: string
  title: string
  code: string
  language: string
  testCases: Array<{ input: string; expected: string }>
  jobDescription: string
  companyName: string
}

export function codeEvaluationPrompt(input: CodeEvalPromptInput): string {
  const testCasesBlock = input.testCases
    .map((tc, i) => `  Test ${i + 1}: Input: ${tc.input} → Expected: ${tc.expected}`)
    .join('\n')

  return `You are a senior software engineer at ${input.companyName} evaluating a candidate's coding solution.

PROBLEM: ${input.title}
${input.question}

TEST CASES:
${testCasesBlock}

CANDIDATE'S CODE (${input.language}):
\`\`\`${input.language}
${input.code}
\`\`\`

JOB CONTEXT:
${input.jobDescription}

EVALUATION CRITERIA:
- Correctness (1-10): Does the code correctly solve the problem? Would it pass all test cases including edge cases?
- Efficiency (1-10): What is the time and space complexity? Is it optimal or close to optimal?
- Code Quality (1-10): Is the code readable, well-structured, with good naming conventions?
- Edge Cases (1-10): Does the code handle edge cases (empty input, large input, duplicates, negative numbers, etc.)?

RULES:
- Be constructive but honest
- Analyze the time and space complexity
- Point out specific bugs if any
- Suggest an optimized solution if the candidate's solution is suboptimal
- Provide the complexity analysis for both the candidate's and optimal solutions

Respond ONLY with valid JSON in this exact format:
{
  "correctnessScore": 7,
  "efficiencyScore": 6,
  "codeQualityScore": 8,
  "edgeCaseScore": 5,
  "overallScore": 6.5,
  "feedback": "detailed feedback about the solution",
  "bugs": ["bug 1 description", "bug 2 description"],
  "optimizedSolution": "the optimal code solution in the same language",
  "complexityAnalysis": {
    "candidateTime": "O(n^2)",
    "candidateSpace": "O(1)",
    "optimalTime": "O(n)",
    "optimalSpace": "O(n)"
  },
  "tips": ["tip 1", "tip 2", "tip 3"]
}`
}
