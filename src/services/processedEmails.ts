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

export { createProcessedEmailAnyway }
