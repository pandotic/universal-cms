const TOKEN_STORAGE_KEY = 'cos-command-center-token'

/** Get the stored auth token (or null) */
export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY)
}

/** Build headers with auth token for API calls */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export { TOKEN_STORAGE_KEY }
