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

  return `You are an expert interview coach. Generate exactly 10 interview questions customized for this candidate and role.

CANDIDATE RESUME:
${input.resumeText}

JOB DESCRIPTION:
${input.jobDescription}

COMPANY: ${input.companyName}
ROLE: ${input.roleTitle}
${contextBlock}

RULES:
- Generate exactly 10 questions
- Mix of types: 4 technical, 3 behavioral (STAR format), 2 situational, 1 system design
- Match difficulty to the candidate's experience level
- Reference specific skills/projects from the resume
- If company patterns are provided, align questions with that company's interview style
- Make questions specific, not generic

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
