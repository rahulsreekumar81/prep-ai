import { useCallback, useRef } from 'react'

const DEBOUNCE_MS = 5000
const MIN_DIFF_CHARS = 20
const MIN_AI_GAP_MS = 15000

export function useCodeDebounce(onTrigger: (code: string) => void) {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastCodeRef = useRef('')
  const lastTriggerTime = useRef(0)
  const isThrottledRef = useRef(false)

  const handleCodeChange = useCallback(
    (code: string) => {
      // Skip if diff is too small
      const diff = Math.abs(code.length - lastCodeRef.current.length)
      if (diff < MIN_DIFF_CHARS) return

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        const now = Date.now()
        if (now - lastTriggerTime.current < MIN_AI_GAP_MS) {
          isThrottledRef.current = true
          return
        }

        isThrottledRef.current = false
        lastCodeRef.current = code
        lastTriggerTime.current = now
        onTrigger(code)
      }, DEBOUNCE_MS)
    },
    [onTrigger],
  )

  const triggerManually = useCallback(
    (code: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      lastCodeRef.current = code
      lastTriggerTime.current = Date.now()
      onTrigger(code)
    },
    [onTrigger],
  )

  return { handleCodeChange, triggerManually }
}
