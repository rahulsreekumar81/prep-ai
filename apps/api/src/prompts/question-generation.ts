interface QuestionPromptInput {
  resumeText: string
  jobDescription: string
  companyName: string
  roleTitle: string
  companyContext: Array<{ content: string }>
}

export function questionGenerationPrompt(input: QuestionPromptInput): string {
  const contextBlock =
    input.companyContext.length > 0
      ? `
Company-specific interview patterns and common questions:
${input.companyContext.map((c) => c.content).join('\n---\n')}
`
      : ''

  return `You are an expert interview coach. Generate exactly 7 interview questions customized for this candidate and role.

CANDIDATE RESUME:
${input.resumeText}

JOB DESCRIPTION:
${input.jobDescription}

COMPANY: ${input.companyName}
ROLE: ${input.roleTitle}
${contextBlock}

RULES:
- Generate exactly 7 questions
- Mix of types: 3 technical, 2 behavioral (STAR format), 1 situational, 1 system design
- Match difficulty to the candidate's experience level
- Reference specific skills/projects from the resume
- If company patterns are provided, align questions with that company's interview style
- Make questions specific, not generic
- NOTE: DSA coding questions will be added separately, so focus on conceptual technical questions, behavioral, situational, and system design

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "content": "the question text",
      "type": "technical|behavioral|system_design|situational",
      "difficulty": "easy|medium|hard"
    }
  ]
}`
}
