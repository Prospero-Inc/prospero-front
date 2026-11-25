import type { ShortcutToken } from '@/services/shortcuts'

/** Activo: sin revocar y ya recibió al menos un gasto. */
export const isShortcutActive = (tokens: ShortcutToken[] | undefined) =>
  (tokens ?? []).some(token => !token.revokedAt && token.lastUsedAt)
