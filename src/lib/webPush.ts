import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib/apiService'
import type {
  PushOkResponse,
  PushSubscriptionData,
  PushUnsubscribeData,
  VapidPublicKeyResponse
} from '@/services/notifications'

/**
 * Web Push estándar (VAPID) del lado del navegador. Todo lo de este módulo
 * corre solo en el cliente: no tocar `window`/`navigator` a nivel módulo.
 *
 * El service worker (`worker/index.js`, bundleado por next-pwa dentro de
 * `sw.js`) solo existe en builds de producción; en `next dev` no hay
 * registro y `getServiceWorkerRegistration` devuelve `null`.
 */

export type PushErrorCode =
  | 'unsupported'
  | 'no-service-worker'
  | 'server-disabled'
  | 'permission-denied'
  | 'permission-dismissed'
  | 'subscribe-failed'
  | 'backend-failed'

export class PushSubscriptionError extends Error {
  readonly code: PushErrorCode

  constructor(code: PushErrorCode, cause?: unknown) {
    super(cause instanceof Error ? cause.message : code, { cause })
    this.name = 'PushSubscriptionError'
    this.code = code
  }
}

interface IosNavigator extends Navigator {
  /** Safari iOS: `true` si la web se abrió desde la pantalla de inicio. */
  standalone?: boolean
}

const SERVICE_WORKER_TIMEOUT_MS = 3000

export const isPushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

/** iPhone/iPod/iPad, incluido el iPadOS que se reporta como "MacIntel". */
export const isIosDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export const isStandaloneDisplay = (): boolean => {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as IosNavigator).standalone === true
  )
}

/** VAPID public key (base64url) → bytes para `applicationServerKey`. */
export const urlBase64ToUint8Array = (
  base64String: string
): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

/**
 * `navigator.serviceWorker.ready` nunca resuelve si no hay service worker
 * (dev, o el registro falló): lo acotamos con un timeout para no colgar
 * la UI ni el logout.
 */
export const getServiceWorkerRegistration = async (
  timeoutMs: number = SERVICE_WORKER_TIMEOUT_MS
): Promise<ServiceWorkerRegistration | null> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
    return null

  const existing = await navigator.serviceWorker.getRegistration()
  if (existing?.active) return existing

  return await Promise.race<ServiceWorkerRegistration | null>([
    navigator.serviceWorker.ready,
    new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs))
  ])
}

export const getCurrentPushSubscription =
  async (): Promise<PushSubscription | null> => {
    if (!isPushSupported()) return null
    const registration = await getServiceWorkerRegistration()
    if (!registration) return null
    return await registration.pushManager.getSubscription()
  }

const authHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`
})

const isVapidPublicKeyResponse = (
  value: unknown
): value is VapidPublicKeyResponse =>
  typeof value === 'object' &&
  value !== null &&
  'publicKey' in value &&
  (value.publicKey === null || typeof value.publicKey === 'string')

/** `null` = el servidor no tiene push configurado. */
export const fetchVapidPublicKey = async (): Promise<string | null> => {
  const response = await localApiService.request<unknown>({
    endPoint: '/proxy/push-vapid-public-key',
    method: HttpMethod.GET
  })
  if (!isVapidPublicKeyResponse(response)) return null
  return response.publicKey || null
}

const toSubscriptionData = (
  subscription: PushSubscription
): PushSubscriptionData => {
  const { endpoint, keys } = subscription.toJSON()
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    throw new PushSubscriptionError(
      'subscribe-failed',
      new Error('Push subscription is missing endpoint or keys')
    )

  return {
    endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    userAgent: navigator.userAgent
  }
}

/** Registra (upsert por endpoint) la suscripción de este navegador. */
export const registerSubscriptionWithBackend = async (
  subscription: PushSubscription,
  accessToken: string
): Promise<void> => {
  try {
    await localApiService.request<PushOkResponse>({
      endPoint: '/proxy/push-subscribe',
      method: HttpMethod.POST,
      data: toSubscriptionData(subscription),
      headers: authHeaders(accessToken)
    })
  } catch (error) {
    if (error instanceof PushSubscriptionError) throw error
    throw new PushSubscriptionError('backend-failed', error)
  }
}

/**
 * Pide permiso, suscribe este navegador y lo registra en el backend.
 * Reutiliza la suscripción existente si ya hay una.
 */
const sameKey = (
  current: ArrayBuffer | null,
  expected: Uint8Array
): boolean => {
  if (!current) return false
  const bytes = new Uint8Array(current)
  return (
    bytes.length === expected.length &&
    bytes.every((byte, index) => byte === expected[index])
  )
}

export const subscribeThisBrowser = async (
  publicKey: string | null,
  accessToken: string
): Promise<PushSubscription> => {
  if (!isPushSupported()) throw new PushSubscriptionError('unsupported')
  if (!publicKey) throw new PushSubscriptionError('server-disabled')

  const permission = await Notification.requestPermission()
  if (permission === 'denied')
    throw new PushSubscriptionError('permission-denied')
  if (permission !== 'granted')
    throw new PushSubscriptionError('permission-dismissed')

  const registration = await getServiceWorkerRegistration()
  if (!registration) throw new PushSubscriptionError('no-service-worker')

  const applicationServerKey = urlBase64ToUint8Array(publicKey)
  let subscription = await registration.pushManager.getSubscription()
  // A subscription made with a different VAPID key (keys rotated, or a
  // leftover from another app on the same origin, e.g. localhost) can't
  // receive our pushes — the push service rejects them. Replace it.
  if (
    subscription &&
    !sameKey(subscription.options.applicationServerKey, applicationServerKey)
  ) {
    await subscription.unsubscribe().catch(() => undefined)
    subscription = null
  }
  if (!subscription)
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
    } catch (error) {
      // The browser's own reason (e.g. Brave with push messaging disabled:
      // "AbortError: Registration failed - push service error") is the only
      // way to diagnose this — keep it visible in devtools.
      console.error('pushManager.subscribe failed', error)
      throw new PushSubscriptionError('subscribe-failed', error)
    }

  await registerSubscriptionWithBackend(subscription, accessToken)
  return subscription
}

/**
 * Desuscribe este navegador: avisa al backend (idempotente) y anula la
 * suscripción local. La anulación local se hace igual aunque el backend
 * falle, para que el navegador deje de recibir pushes; en ese caso el
 * error del backend se re-lanza después.
 */
export const unsubscribeThisBrowser = async (
  accessToken: string | undefined
): Promise<void> => {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return

  const data: PushUnsubscribeData = { endpoint: subscription.endpoint }
  let backendError: unknown = null
  if (accessToken)
    try {
      await localApiService.request<PushOkResponse>({
        endPoint: '/proxy/push-unsubscribe',
        method: HttpMethod.POST,
        data,
        headers: authHeaders(accessToken)
      })
    } catch (error) {
      backendError = error
    }

  await subscription.unsubscribe()

  if (backendError)
    throw new PushSubscriptionError('backend-failed', backendError)
}
