import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

/** Una fila de `GET /shortcuts/tokens` (nunca trae el token en sí). */
export interface ShortcutToken {
  id: number
  name: string
  scope: string
  /** Último gasto que el atajo mandó con este token, `null` si ninguno. */
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

/** `POST /shortcuts/tokens`: el único momento en que se ve el `token`
 * (`prs_...`). */
export interface CreatedShortcutToken {
  id: number
  name: string
  token: string
  createdAt: string
}

export interface CreateShortcutTokenData {
  name: string
}

/** `GET /shortcuts/status`: the last expense the shortcut sent, if any —
 * what tells the screen it's already working. */
export interface ShortcutStatus {
  lastTransaction: {
    id: number
    description: string | null
    amount: number
    date: string
    /** When Prospero received it. */
    createdAt: string
  } | null
}

/** Activo: sin revocar y ya recibió al menos un gasto. */
export const isShortcutActive = (tokens: ShortcutToken[] | undefined) =>
  (tokens ?? []).some(token => !token.revokedAt && token.lastUsedAt)

const getShortcutTokens = async (
  _filters: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/shortcuts/tokens',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const createShortcutToken = async (
  data: CreateShortcutTokenData,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: '/shortcuts/tokens',
    data,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

const revokeShortcutToken = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: `/shortcuts/tokens/${id}/revoke`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { getShortcutTokens, createShortcutToken, revokeShortcutToken }
