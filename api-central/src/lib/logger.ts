const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

export const logger = {
  error(message: string, ...args: unknown[]) {
    console.error(`[API-Central] ${message}`, ...args)
  },
  warn(message: string, ...args: unknown[]) {
    if (isDev) console.warn(`[API-Central] ${message}`, ...args)
  },
  info(message: string, ...args: unknown[]) {
    if (isDev) console.info(`[API-Central] ${message}`, ...args)
  },
}
