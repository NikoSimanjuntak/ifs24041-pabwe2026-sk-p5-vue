import { describe, expect, it, vi } from 'vitest'
import { login, register } from './authApi'
import { apiPost } from '@/helpers/apiHelper'

vi.mock('@/helpers/apiHelper', () => ({ apiPost: vi.fn(() => Promise.resolve({ data: {} })) }))

describe('authApi', () => {
  it('login memanggil POST /auth/login hanya dengan email & password', async () => {
    await login({ email: 'a@b.co', password: 'secret', extra: 1 })
    expect(apiPost).toHaveBeenCalledWith('/auth/login', { email: 'a@b.co', password: 'secret' })
  })

  it('register memanggil POST /auth/register', async () => {
    await register({ name: 'Ani', email: 'a@b.co', password: 'secret', confirmPassword: 'secret' })
    expect(apiPost).toHaveBeenCalledWith('/auth/register', { name: 'Ani', email: 'a@b.co', password: 'secret' })
  })
})
