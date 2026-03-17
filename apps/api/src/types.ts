import type { Context } from 'hono'

// Shared env type for authenticated routes
export type AuthVariables = {
  userId: string
  email: string
}

export type AuthContext = Context<{ Variables: AuthVariables }>
