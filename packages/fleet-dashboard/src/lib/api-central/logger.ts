const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  error: (...args: unknown[]) => console.error('[API-Central]', ...args),
  warn: (...args: unknown[]) => isDev && console.warn('[API-Central]', ...args),
  info: (...args: unknown[]) => isDev && console.info('[API-Central]', ...args),
}
