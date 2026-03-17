const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...fetchOptions } = options || {}

  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Only set Content-Type for non-FormData requests
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new ApiError(json.error || 'Request failed', res.status)
  }

  return json.data
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string; name: string }) =>
      request<{ token: string; user: any }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: (token: string) => request<{ user: any }>('/api/auth/me', { token }),
  },

  interviews: {
    create: (
      token: string,
      data: {
        resumeText: string
        jobDescription: string
        companyName?: string
        roleTitle?: string
      },
    ) =>
      request<any>('/api/interviews', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),

    list: (token: string) => request<{ interviews: any[] }>('/api/interviews', { token }),

    get: (token: string, id: string) => request<any>(`/api/interviews/${id}`, { token }),

    uploadResume: async (token: string, file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return request<{ id: string; text: string; pages: number }>(
        '/api/interviews/upload-resume',
        {
          method: 'POST',
          body: formData,
          token,
        },
      )
    },

    transcribe: async (token: string, interviewId: string, audioBlob: Blob) => {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      return request<{ transcript: string }>(`/api/interviews/${interviewId}/transcribe`, {
        method: 'POST',
        body: formData,
        token,
      })
    },

    complete: (token: string, id: string) =>
      request<any>(`/api/interviews/${id}/complete`, { method: 'POST', token }),
  },

  evaluations: {
    submit: (
      token: string,
      data: {
        questionId: string
        interviewId: string
        answer: string
        codeAnswer?: string
        language?: string
      },
    ) =>
      request<any>('/api/evaluations', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),

    getSummary: (token: string, interviewId: string) =>
      request<any>(`/api/evaluations/interview/${interviewId}`, { token }),
  },

  users: {
    dashboard: (token: string) => request<any>('/api/users/dashboard', { token }),
    progress: (token: string) => request<any>('/api/users/progress', { token }),
  },
}
