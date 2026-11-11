/**
 * Copies text that is still being fetched, from inside the tap that asked
 * for it. iOS Safari only lets a page write to the clipboard during the
 * user's gesture, and that gesture is gone by the time a request returns;
 * a `ClipboardItem` built from a promise is written right away (still in the
 * gesture) and filled in when the text arrives. Elsewhere it falls back to
 * `writeText` once the text is known.
 *
 * Resolves with the text; `copied` is false when the browser refused (the
 * caller then shows the text so it can be copied by hand).
 */
export const copyPendingText = async (
  pending: Promise<string>
): Promise<{ text: string; copied: boolean }> => {
  const clipboard = typeof navigator !== 'undefined' && navigator.clipboard
  const canWritePromise =
    !!clipboard &&
    typeof clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined'

  if (canWritePromise) {
    const write = clipboard
      .write([
        new ClipboardItem({
          'text/plain': pending.then(
            text => new Blob([text], { type: 'text/plain' })
          )
        })
      ])
      .then(
        () => true,
        () => false
      )
    // The request's own failure wins over the clipboard's.
    const text = await pending
    const copied = await write
    if (copied) return { text, copied }
    return { text, copied: await copyText(text) }
  }

  const text = await pending
  return { text, copied: await copyText(text) }
}

/** `writeText` that answers false instead of throwing. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
