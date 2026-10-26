import { signOut, SignOutParams } from 'next-auth/react'

import { unsubscribeThisBrowser } from './webPush'

/** Tope para la limpieza de push: cerrar sesión nunca debe quedar colgado. */
const PUSH_CLEANUP_TIMEOUT_MS = 4000

/**
 * Logout explícito: antes de `signOut`, desuscribe este navegador de Web Push
 * para que el próximo usuario del mismo navegador no reciba los avisos del
 * anterior. Best-effort: si la limpieza falla o tarda, igual cierra sesión.
 */
export const signOutAndUnsubscribePush = async (
  accessToken: string | undefined,
  options?: SignOutParams<true>
): Promise<void> => {
  try {
    await Promise.race([
      unsubscribeThisBrowser(accessToken),
      new Promise<void>(resolve => setTimeout(resolve, PUSH_CLEANUP_TIMEOUT_MS))
    ])
  } catch (error) {
    // Intencional: un fallo de push no puede impedir cerrar sesión.
    console.warn('Push unsubscribe on sign-out failed', error)
  }
  await signOut(options)
}
