import type { PeriodSummary } from '@/services/periods'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

/** Etiqueta legible de un período: "10 oct – 23 oct", "Actual · desde 10
 * oct"… `timeZone: 'UTC'` porque las fechas se guardan a medianoche UTC. */
export const usePeriodLabel = () => {
  const { t } = useTranslation('common', { keyPrefix: 'movementFilters' })
  const { locale } = useRouter()
  const formatter = new Intl.DateTimeFormat(locale ?? 'es', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
  const format = (date: string) => formatter.format(new Date(date))

  return (period: PeriodSummary): string => {
    if (period.startDate && period.isOpen)
      return t('periodCurrent', { start: format(period.startDate) })
    if (period.startDate && period.endDate)
      return t('periodRange', {
        start: format(period.startDate),
        end: format(period.endDate)
      })
    if (period.endDate)
      return t('periodInitial', { end: format(period.endDate) })
    // Sin ninguna nómina registrada hay un único período sin límites.
    return t('periodAll')
  }
}
