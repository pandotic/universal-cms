import type { Handler } from '@netlify/functions'
import { generateToken, validateToken } from './lib/auth-middleware'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const body = JSON.parse(event.body || '{}')

  // Token refresh endpoint
  if (body.action === 'refresh') {
    const authHeader = event.headers['authorization'] || event.headers['Authorization']
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token && validateToken(token)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, token: generateToken() }),
      }
    }
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    }
  }

  // Login endpoint
  const correctPassword = process.env.APP_PASSWORD
  if (!correctPassword) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'APP_PASSWORD not configured' }),
    }
  }

  if (body.password === correctPassword) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, token: generateToken() }),
    }
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'Invalid password' }),
  }
}

export { handler }
