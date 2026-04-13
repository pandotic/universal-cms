// ─── Client-Side Encryption Helpers ──────────────────────────────────────────
// AES-256-GCM encryption with PBKDF2 key derivation (PIN-protected).
// Extracted from APICentral.tsx for reuse across the APIs & AI section.

export const ENCRYPTION_PREFIX = 'ENC:'

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptValue(value: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(pin, salt)
  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(value)
  )
  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  return ENCRYPTION_PREFIX + btoa(String.fromCharCode(...combined))
}

export async function decryptValue(encryptedValue: string, pin: string): Promise<string> {
  if (!encryptedValue.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedValue // Not encrypted
  }
  try {
    const data = Uint8Array.from(atob(encryptedValue.slice(ENCRYPTION_PREFIX.length)), c => c.charCodeAt(0))
    const salt = data.slice(0, 16)
    const iv = data.slice(16, 28)
    const encrypted = data.slice(28)
    const key = await deriveKey(pin, salt)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encrypted.buffer as ArrayBuffer
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    throw new Error('Invalid PIN or corrupted data')
  }
}

export function maskValue(v: string): string {
  if (!v) return ''
  if (v.startsWith(ENCRYPTION_PREFIX)) return '******** (encrypted)'
  if (v.length <= 4) return '****'
  return '****' + v.slice(-4)
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX)
}
