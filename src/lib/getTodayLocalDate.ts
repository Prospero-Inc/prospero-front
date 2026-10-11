// `new Date().toISOString().slice(0, 10)` converts to UTC before slicing,
// so it shows tomorrow's date for any local time past ~18:00 in negative-
// UTC-offset zones (e.g. El Salvador, UTC-6). Use local getters instead.
export const getTodayLocalDate = (): string => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
