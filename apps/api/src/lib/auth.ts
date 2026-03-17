import { SignJWT, jwtVerify } from 'jose'
// @ts-expect-error bcryptjs has no types in some setups
import bcrypt from 'bcryptjs'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string }> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as unknown as { userId: string; email: string }
}
