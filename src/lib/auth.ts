import { createHash, randomBytes, timingSafeEqual } from 'crypto'

// Simple password hashing using bcrypt-like approach
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':')
  if (!salt || !hash) return false
  
  const computedHash = createHash('sha256')
    .update(password + salt)
    .digest('hex')
  
  return timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash))
}

// Generate a simple session token
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}
