export type SplitKey = 'needs' | 'wants' | 'savings'
export type Split = Record<SplitKey, number>

export const SPLIT_KEYS: SplitKey[] = ['needs', 'wants', 'savings']
export const RECOMMENDED_SPLIT: Split = { needs: 50, wants: 30, savings: 20 }
export const SPLIT_STEP = 5

/**
 * Moves `delta` points into `key`, taking them from (or giving them to)
 * the following categories in order, so the split always adds up to 100 —
 * the backend rejects anything else — and no category leaves 0–100.
 */
export const adjustSplit = (
  split: Split,
  key: SplitKey,
  delta: number
): Split => {
  const target = split[key] + delta
  if (target < 0 || target > 100) return split

  const start = SPLIT_KEYS.indexOf(key)
  const others = [1, 2].map(offset => SPLIT_KEYS[(start + offset) % 3])
  const donor = others.find(other => {
    const next = split[other] - delta
    return next >= 0 && next <= 100
  })
  if (!donor) return split

  return { ...split, [key]: target, [donor]: split[donor] - delta }
}
