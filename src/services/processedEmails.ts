import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

/**
 * `POST /processed-emails/:id/create-anyway` — crea una `Transaction` real a
 * partir de un `ProcessedEmail` marcado como "posible duplicado", cuando el
 * usuario confirma que en realidad es un movimiento distinto. 201 con la
 * transacción creada; 404 si no es del usuario o no es un `PossibleDuplicate`;
 * 409 si ya fue resuelto antes; 422 si el correo es viejo y no tiene snapshot
 * de monto/fecha. Invocada desde el botón "No son el mismo" en
 * `expenditures.tsx`, usando `possibleGmailDuplicate.id` de `GET /transactions`.
 */
const createProcessedEmailAnyway = async (
  _ignore: unknown,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: `/processed-emails/${id}/create-anyway`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

/**
 * `POST /processed-emails/:id/dismiss` — marca un `ProcessedEmail` de
 * "posible duplicado" como resuelto (`resolvedAt`) sin crear ninguna
 * `Transaction`, para cuando el usuario confirma que el correo corresponde al
 * mismo movimiento que ya tiene registrado manualmente. Mismas reglas de
 * ownership/estado que `create-anyway`: 404 si no es del usuario o no es un
 * `PossibleDuplicate`; 409 si ya fue resuelto antes. No hay caso 422, no
 * depende del snapshot de monto/fecha. Invocada desde el botón "Es el mismo
 * movimiento" en `expenditures.tsx`.
 */
const dismissProcessedEmail = async (
  _ignore: unknown,
  params: Params | unknown
) => {
  const { lang, authorization, id } = params as Params & { id: string }
  return await externalApiService.request({
    method: HttpMethod.POST,
    endPoint: `/processed-emails/${id}/dismiss`,
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { createProcessedEmailAnyway, dismissProcessedEmail }
