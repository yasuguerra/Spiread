import { useCallback, useRef } from 'react'

export interface UseInputDebounceOptions {
  delay: number
  onInput: (value: any) => void
}

export function useInputDebounce({ delay, onInput }: UseInputDebounceOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastInputRef = useRef<number>(0)

  const debouncedInput = useCallback((value: any) => {
    const now = Date.now()
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // If enough time has passed since last input, process immediately
    if (now - lastInputRef.current >= delay) {
      lastInputRef.current = now
      onInput(value)
      return
    }

    // Otherwise, debounce
    timeoutRef.current = setTimeout(() => {
      lastInputRef.current = Date.now()
      onInput(value)
    }, delay)
  }, [delay, onInput])

  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return { debouncedInput, cancelDebounce }
}
