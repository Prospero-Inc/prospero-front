import { formatMoney } from '@/lib/formatMoney'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

/** Formateadores de fecha y monto para los listados. `timeZone: 'UTC'`: las
 * fechas llegan como medianoche UTC y SSR (UTC) y navegador (UTC-6) tienen
 * que formatear el mismo día para no romper la hidratación. */
export const useMovementFormatters = () => {
  const { locale } = useRouter()

  return useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat(locale ?? 'es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    })

    return {
      formatDate: (date: string) => dateFormatter.format(new Date(date)),
      formatAmount: (amount: number) => formatMoney(Math.abs(amount), locale)
    }
  }, [locale])
}
