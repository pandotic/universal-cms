import { NextRequest, NextResponse } from 'next/server'
import { generateToken, validateToken } from '@/lib/api-central/auth-middleware'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Token refresh endpoint
  if (body.action === 'refresh') {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token && validateToken(token)) {
      return NextResponse.json({ success: true, token: generateToken() })
    }
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // Login endpoint
  const correctPassword = process.env.APP_PASSWORD
  if (!correctPassword) {
    return NextResponse.json({ error: 'APP_PASSWORD not configured' }, { status: 500 })
  }

  if (body.password === correctPassword) {
    return NextResponse.json({ success: true, token: generateToken() })
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
