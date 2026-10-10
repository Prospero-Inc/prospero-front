import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib'
import { Params } from '@/types'

export interface ReviewQueueSummary {
  pendingTransactions: number
  pendingSalaries: number
}

/** Conteo barato de transacciones/ingresos detectados por Gmail que todavía
 * necesitan revisión del usuario — usado para el badge de pendientes en el
 * nav. Pensado para llamarse en cada carga de página/layout. */
const getReviewQueueSummary = async (
  _ignore: unknown,
  params: Params | unknown
): Promise<unknown> => {
  const { lang, authorization } = params as Params
  return await externalApiService.request({
    method: HttpMethod.GET,
    endPoint: '/review-queue/summary',
    headers: {
      'x-lang': `${lang}`,
      Authorization: authorization
    }
  })
}

export { getReviewQueueSummary }
