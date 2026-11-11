const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60]
]

/** "hace 5 minutos", "ayer", "hace 2 meses"… (or "ahora" under a minute),
 * in the page's language; `short` gives "hace 2 h". */
export const formatRelativeTime = (
  iso: string,
  locale: string,
  {
    now = Date.now(),
    style = 'long'
  }: { now?: number; style?: Intl.RelativeTimeFormatStyle } = {}
): string => {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style })
  const unit = UNITS.find(([, size]) => Math.abs(seconds) >= size)
  return unit
    ? format.format(Math.round(seconds / unit[1]), unit[0])
    : format.format(0, 'second')
}
