/**
 * App-wide money format: dollars with El Salvador's convention (1,234.50).
 * Plain 'es' would give 1234,50. No `style: 'currency'`: there is no
 * multi-currency (out of MVP scope), so the symbol is always `$`, and the
 * sign goes before it (`-$120.00`, never `$-120.00`).
 */
export const formatMoney = (amount: number, locale?: string): string => {
  const formatter = new Intl.NumberFormat(
    !locale || locale === 'es' ? 'es-SV' : locale,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )
  return `${amount < 0 ? '-' : ''}$${formatter.format(Math.abs(amount))}`
}
