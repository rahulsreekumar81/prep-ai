const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  const json = await res.json()
  return json.data
}

export const api = {
  // Auth
  signup: (data: { email: string; password: string; name: string }) =>
    request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: () => request('/api/auth/me'),

  // Resume
  uploadResume: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_URL}/api/interviews/upload-resume`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const json = await res.json()
    return json.data
  },

  // Interview
  startInterview: (data: {
    resumeText: string
    jobDescription: string
    companyName?: string
    roleTitle?: string
  }) => request('/api/interviews', { method: 'POST', body: JSON.stringify(data) }),

  getInterviews: () => request('/api/interviews'),

  getInterview: (id: string) => request(`/api/interviews/${id}`),

  // Audio transcription
  transcribeAudio: async (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    const res = await fetch(`${API_URL}/api/interviews/temp/questions/temp/audio`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const json = await res.json()
    return json.data
  },

  // Evaluation
  evaluateAnswer: (data: {
    question: string
    answer: string
    jobDescription: string
    companyName?: string
  }) => request('/api/evaluations', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => request('/api/users/dashboard'),
  getProgress: () => request('/api/users/progress'),
}
