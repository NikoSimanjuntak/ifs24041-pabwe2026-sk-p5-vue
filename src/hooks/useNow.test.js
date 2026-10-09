import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { render } from '@testing-library/vue'
import { useNow } from './useNow'

const make = (interval) => {
  let now
  const Comp = defineComponent({
    setup() {
      now = useNow(interval)
      return () => null
    },
  })
  return { Comp, get: () => now }
}

describe('useNow', () => {
  it('memperbarui waktu berkala dan berhenti saat unmount', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T00:00:00Z'))
    const { Comp, get } = make(1000)
    const { unmount } = render(Comp)
    const first = get().value
    vi.advanceTimersByTime(1000)
    expect(get().value).toBe(first + 1000)
    unmount()
    vi.advanceTimersByTime(5000)
    expect(get().value).toBe(first + 1000)
  })

  it('memakai interval bawaan 30 detik', () => {
    vi.useFakeTimers()
    const { Comp, get } = make()
    render(Comp)
    const first = get().value
    vi.advanceTimersByTime(29000)
    expect(get().value).toBe(first)
    vi.advanceTimersByTime(1000)
    expect(get().value).toBe(first + 30000)
  })
})
