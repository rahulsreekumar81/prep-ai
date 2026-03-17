interface EvalPromptInput {
  question: string
  answer: string
  jobDescription: string
  companyName: string
}

export function answerEvaluationPrompt(input: EvalPromptInput): string {
  return `You are a senior technical interviewer at ${input.companyName}. Evaluate this candidate's answer.

QUESTION:
${input.question}

CANDIDATE'S ANSWER:
${input.answer}

JOB CONTEXT:
${input.jobDescription}

EVALUATION CRITERIA:
- Relevance (1-10): Does the answer address the question directly?
- Depth (1-10): Is the answer detailed enough with specific examples?
- Clarity (1-10): Is the answer well-communicated and easy to follow?
- Structure (1-10): Does it follow a logical structure (STAR format for behavioral)?

RULES:
- Be constructive but honest
- Point out specific strengths and weaknesses
- Provide a concrete sample answer that would score 9-10
- Give 2-3 actionable tips for improvement

Respond ONLY with valid JSON in this exact format:
{
  "relevanceScore": 7,
  "depthScore": 6,
  "clarityScore": 8,
  "structureScore": 5,
  "overallScore": 6.5,
  "feedback": "detailed feedback here",
  "sampleAnswer": "a model answer that would score 9-10",
  "tips": ["tip 1", "tip 2", "tip 3"]
}`
}
