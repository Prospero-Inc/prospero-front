/* eslint-disable no-restricted-globals */
/**
 * Service worker custom de Prospero (Web Push estándar VAPID, sin Firebase).
 *
 * next-pwa 5.6 detecta `worker/index.js`, lo bundlea aparte como
 * `public/worker-<buildId>.js` y lo carga desde el `sw.js` generado vía
 * `importScripts`. Solo existe en builds de producción: en `next dev`
 * next-pwa está deshabilitado (ver next.config.js).
 *
 * Payload esperado (JSON): { title, body, url, tag } — `url` es una ruta
 * relativa del mismo origen (ej. "/expenditures").
 */

const DEFAULT_TITLE = 'Prospero'
const DEFAULT_URL = '/dashboard'
const ICON = '/icons/icon-192.png'

/**
 * Solo aceptamos URLs del mismo origen: un payload no debería poder abrir
 * un sitio externo desde una notificación nuestra.
 * @param {unknown} url
 * @returns {string}
 */
const toSameOriginUrl = url => {
  if (typeof url !== 'string' || url.length === 0) return DEFAULT_URL
  try {
    const resolved = new URL(url, self.location.origin)
    if (resolved.origin !== self.location.origin) return DEFAULT_URL
    return resolved.pathname + resolved.search + resolved.hash
  } catch (_error) {
    return DEFAULT_URL
  }
}

/**
 * @param {PushEvent} event
 * @returns {{ title: string, body: string, url: string, tag: string | undefined }}
 */
const parsePayload = event => {
  /** @type {Record<string, unknown>} */
  let raw = {}
  if (event.data) {
    try {
      const parsed = event.data.json()
      if (parsed && typeof parsed === 'object') raw = parsed
    } catch (_error) {
      // Payload no-JSON: usamos el texto plano como cuerpo.
      try {
        raw = { body: event.data.text() }
      } catch (_ignored) {
        raw = {}
      }
    }
  }

  return {
    title:
      typeof raw.title === 'string' && raw.title ? raw.title : DEFAULT_TITLE,
    body: typeof raw.body === 'string' ? raw.body : '',
    url: toSameOriginUrl(raw.url),
    tag: typeof raw.tag === 'string' && raw.tag ? raw.tag : undefined
  }
}

self.addEventListener('push', event => {
  const { title, body, url, tag } = parsePayload(event)

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: ICON,
      badge: ICON,
      tag,
      // `renotify` sin `tag` es un TypeError en Chrome.
      renotify: Boolean(tag),
      data: { url }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const data = event.notification.data
  const path = toSameOriginUrl(data && data.url)
  const targetUrl = new URL(path, self.location.origin).href

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })

      const sameOrigin = windowClients.find(client => {
        try {
          return new URL(client.url).origin === self.location.origin
        } catch (_error) {
          return false
        }
      })

      if (sameOrigin) {
        const focused = await sameOrigin.focus()
        if (focused.url !== targetUrl && 'navigate' in focused) {
          try {
            await focused.navigate(targetUrl)
            return
          } catch (_error) {
            // `navigate` falla en clientes no controlados por este SW:
            // caemos a abrir una pestaña nueva.
          }
        } else {
          return
        }
      }

      await self.clients.openWindow(targetUrl)
    })()
  )
})

// Cachés de datos de usuario que versiones anteriores del SW llenaban (ver
// NETWORK_ONLY_CACHES en next.config.js). El SW actual ya no las usa; se
// borran para no dejar en disco props/HTML/respuestas de API con datos
// personales — y el `{}` de prefetch que rompía la navegación.
const LEGACY_USER_DATA_CACHES = ['next-data', 'apis', 'others']

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all(LEGACY_USER_DATA_CACHES.map(name => self.caches.delete(name)))
  )
})
