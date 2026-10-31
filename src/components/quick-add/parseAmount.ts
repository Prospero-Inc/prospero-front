/**
 * Reads what the user typed in the amount field: accepts "12.50" and
 * "12,50" (phones in Spanish show a comma key), ignores thousands
 * separators typed as "1,234.50". Returns null unless it's a positive
 * amount with at most 2 decimals.
 */
export const parseAmount = (input: string): number | null => {
  const trimmed = input.trim().replace(/\s/g, '')
  if (!trimmed) return null

  const lastSeparator = Math.max(
    trimmed.lastIndexOf('.'),
    trimmed.lastIndexOf(',')
  )
  const normalized =
    lastSeparator === -1
      ? trimmed
      : `${trimmed
          .slice(0, lastSeparator)
          .replace(/[.,]/g, '')}.${trimmed.slice(lastSeparator + 1)}`

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const value = Number(normalized)
  return value > 0 ? value : null
}
