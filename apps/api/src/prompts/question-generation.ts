interface QuestionPromptInput {
  resumeText: string
  jobDescription: string
  companyName: string
  roleTitle: string
  companyContext: Array<{ content: string }>
  roundType?: 'behavioral' | 'system_design' | 'technical'
  questionCount?: number
}

export function questionGenerationPrompt(input: QuestionPromptInput): string {
  const contextBlock =
    input.companyContext.length > 0
      ? `
Company-specific interview patterns and common questions:
${input.companyContext.map((c) => c.content).join('\n---\n')}
`
      : ''

  const count = input.questionCount || 7

  let typeInstruction: string
  if (input.roundType === 'behavioral') {
    typeInstruction = `- Generate exactly ${count} behavioral questions using STAR format context
- All questions must have type "behavioral"
- Focus on collaboration, conflict resolution, leadership, and values`
  } else if (input.roundType === 'system_design') {
    typeInstruction = `- Generate exactly ${count} system design question(s)
- All questions must have type "system_design"
- Focus on scalability, trade-offs, distributed systems for ${input.companyName}'s scale`
  } else {
    typeInstruction = `- Generate exactly ${count} questions
- Mix of types: 3 technical, 2 behavioral (STAR format), 1 situational, 1 system design
- NOTE: DSA coding questions will be added separately, so focus on conceptual technical questions`
  }

  return `You are an expert interview coach. Generate interview questions customized for this candidate and role.

CANDIDATE RESUME:
${input.resumeText}

JOB DESCRIPTION:
${input.jobDescription}

COMPANY: ${input.companyName}
ROLE: ${input.roleTitle}
${contextBlock}

RULES:
${typeInstruction}
- Match difficulty to the candidate's experience level
- Reference specific skills/projects from the resume when relevant
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
