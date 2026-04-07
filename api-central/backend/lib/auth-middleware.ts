import type { HandlerEvent } from '@netlify/functions'
import { createHmac, randomBytes } from 'crypto'

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

function getSecret(): string {
  const secret = process.env.APP_PASSWORD
  if (!secret) throw new Error('APP_PASSWORD not configured')
  return secret
}

export function generateToken(): string {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
    nonce: randomBytes(16).toString('hex'),
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function validateToken(token: string): boolean {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return false

    const expectedSig = createHmac('sha256', getSecret()).update(data).digest('base64url')
    if (sig !== expectedSig) return false

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (Date.now() > payload.exp) return false

    return true
  } catch {
    return false
  }
}

export function requireAuth(event: HandlerEvent): { statusCode: number; body: string } | null {
  const authHeader = event.headers['authorization'] || event.headers['Authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required' }),
    }
  }

  const token = authHeader.slice(7)
  if (!validateToken(token)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    }
  }

  return null // Auth passed
}
