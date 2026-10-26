import {
  fetchVapidPublicKey,
  getCurrentPushSubscription,
  getServiceWorkerRegistration,
  isIosDevice,
  isPushSupported,
  isStandaloneDisplay,
  PushSubscriptionError,
  registerSubscriptionWithBackend,
  subscribeThisBrowser,
  unsubscribeThisBrowser
} from '@/lib/webPush'
import { useCallback, useEffect, useState } from 'react'

/**
 * Disponibilidad de push en este navegador, en orden de prioridad:
 * - `loading`: todavía detectando.
 * - `ios-requires-install`: iOS/iPadOS fuera de la pantalla de inicio
 *   (Safari solo permite push en la web app instalada, iOS 16.4+).
 * - `unsupported`: el navegador no tiene Service Worker/Push/Notification.
 * - `no-service-worker`: soportado, pero no hay SW registrado (ej. `next dev`).
 * - `server-disabled`: el backend no tiene VAPID configurado.
 * - `denied`: el usuario bloqueó las notificaciones para este sitio.
 * - `available`: se puede activar/desactivar.
 */
export type PushAvailability =
  | 'loading'
  | 'ios-requires-install'
  | 'unsupported'
  | 'no-service-worker'
  | 'server-disabled'
  | 'denied'
  | 'available'

export interface PushSubscriptionState {
  availability: PushAvailability
  permission: NotificationPermission | null
  /** Este navegador tiene una suscripción activa (y permiso concedido). */
  isSubscribed: boolean
  /** Hay un `enable()`/`disable()` en curso. */
  isUpdating: boolean
  enable: () => Promise<void>
  disable: () => Promise<void>
}

interface DetectedState {
  availability: PushAvailability
  permission: NotificationPermission | null
  publicKey: string | null
  subscription: PushSubscription | null
  /** La suscripción viene de una sesión previa: hay que re-registrarla. */
  needsResync: boolean
}

const detectPushState = async (): Promise<DetectedState> => {
  const base: DetectedState = {
    availability: 'unsupported',
    permission: null,
    publicKey: null,
    subscription: null,
    needsResync: false
  }

  if (!isPushSupported()) {
    // En iOS fuera de la pantalla de inicio PushManager directamente no
    // existe: explicamos cómo habilitarlo en vez de decir "no soportado".
    const availability =
      isIosDevice() && !isStandaloneDisplay()
        ? 'ios-requires-install'
        : 'unsupported'
    return { ...base, availability }
  }

  const permission = Notification.permission
  const [registration, publicKey] = await Promise.all([
    getServiceWorkerRegistration(),
    fetchVapidPublicKey().catch((): null => null)
  ])

  if (!registration)
    return { ...base, permission, availability: 'no-service-worker' }
  if (!publicKey)
    return { ...base, permission, availability: 'server-disabled' }
  if (permission === 'denied')
    return { ...base, permission, publicKey, availability: 'denied' }

  const subscription =
    permission === 'granted' ? await getCurrentPushSubscription() : null
  return {
    availability: 'available',
    permission,
    publicKey,
    subscription,
    needsResync: subscription !== null
  }
}

/**
 * Estado y acciones de la suscripción Web Push de *este navegador*. La
 * lógica de navegador/backend vive en `@/lib/webPush`; este hook solo la
 * conecta con el estado de React.
 */
export const usePushSubscription = (
  accessToken: string | undefined
): PushSubscriptionState => {
  const [state, setState] = useState<DetectedState>({
    availability: 'loading',
    permission: null,
    publicKey: null,
    subscription: null,
    needsResync: false
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Sincroniza con APIs del navegador (permiso, SW, suscripción) al montar.
  useEffect(() => {
    let cancelled = false
    detectPushState()
      .then(detected => {
        if (!cancelled) setState(detected)
      })
      .catch(() => {
        if (!cancelled)
          setState(prev => ({ ...prev, availability: 'unsupported' }))
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Si este navegador ya estaba suscripto, re-registramos la suscripción
  // (upsert por endpoint) para que quede asociada al usuario actual aunque
  // la sesión anterior no haya hecho logout explícito.
  const { subscription, needsResync } = state
  useEffect(() => {
    if (!needsResync || !subscription || !accessToken) return
    setState(prev => ({ ...prev, needsResync: false }))
    registerSubscriptionWithBackend(subscription, accessToken).catch(
      (error: unknown) => {
        // Best-effort: el switch sigue reflejando el estado local.
        console.warn('Push subscription re-sync failed', error)
      }
    )
  }, [needsResync, subscription, accessToken])

  const enable = useCallback(async (): Promise<void> => {
    if (!accessToken) throw new PushSubscriptionError('backend-failed')
    setIsUpdating(true)
    try {
      const subscription = await subscribeThisBrowser(
        state.publicKey,
        accessToken
      )
      setState(prev => ({
        ...prev,
        permission: 'granted',
        subscription,
        needsResync: false
      }))
    } catch (error) {
      if (
        error instanceof PushSubscriptionError &&
        error.code === 'permission-denied'
      )
        setState(prev => ({
          ...prev,
          permission: 'denied',
          availability: 'denied'
        }))
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [accessToken, state.publicKey])

  const disable = useCallback(async (): Promise<void> => {
    setIsUpdating(true)
    try {
      await unsubscribeThisBrowser(accessToken)
    } finally {
      // La suscripción local se anula aunque falle el backend: releemos el
      // estado real del navegador en vez de asumirlo.
      const current = await getCurrentPushSubscription().catch((): null => null)
      setState(prev => ({
        ...prev,
        subscription: current,
        needsResync: false
      }))
      setIsUpdating(false)
    }
  }, [accessToken])

  return {
    availability: state.availability,
    permission: state.permission,
    isSubscribed: state.subscription !== null,
    isUpdating,
    enable,
    disable
  }
}
