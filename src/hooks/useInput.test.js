import { describe, expect, it } from 'vitest'
import { useInput } from './useInput'

describe('useInput', () => {
  it('memiliki nilai awal, default string kosong', () => {
    expect(useInput().value.value).toBe('')
    expect(useInput('halo').value.value).toBe('halo')
  })

  it('onChange menerima event DOM', () => {
    const { value, onChange } = useInput()
    onChange({ target: { value: 'dari event' } })
    expect(value.value).toBe('dari event')
  })

  it('onChange menerima nilai mentah, termasuk nilai falsy', () => {
    const { value, onChange } = useInput('x')
    onChange('mentah')
    expect(value.value).toBe('mentah')
    onChange(null)
    expect(value.value).toBeNull()
  })

  it('reset mengembalikan nilai awal atau nilai baru', () => {
    const { value, onChange, reset } = useInput('awal')
    onChange('ubah')
    reset()
    expect(value.value).toBe('awal')
    reset('baru')
    expect(value.value).toBe('baru')
  })
})
