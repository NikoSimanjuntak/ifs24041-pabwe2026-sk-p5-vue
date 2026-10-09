import { describe, expect, it, vi } from 'vitest'
import { getMe, getUsers, updateMe, updatePassword, updatePhoto } from './userApi'
import { apiGet, apiPut, apiRequest } from '@/helpers/apiHelper'

vi.mock('@/helpers/apiHelper', () => ({
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPut: vi.fn(() => Promise.resolve({})),
  apiRequest: vi.fn(() => Promise.resolve({})),
}))

describe('userApi', () => {
  it('getUsers memanggil GET /users', async () => {
    await getUsers({ search: 'a' })
    expect(apiGet).toHaveBeenCalledWith('/users', { search: 'a' })
  })

  it('getMe memanggil GET /users/me', async () => {
    await getMe()
    expect(apiGet).toHaveBeenCalledWith('/users/me')
  })

  it('updateMe memanggil PUT /users/me', async () => {
    await updateMe({ name: 'A', email: 'a@b.co', x: 1 })
    expect(apiPut).toHaveBeenCalledWith('/users/me', { name: 'A', email: 'a@b.co' })
  })

  it('updatePhoto mengirim FormData berisi field photo', async () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await updatePhoto(file)
    const [path, options] = apiRequest.mock.calls[0]
    expect(path).toBe('/users/me/photo')
    expect(options.method).toBe('POST')
    expect(options.body.get('photo')).toBe(file)
  })

  it('updatePassword memanggil PUT /users/me/password', async () => {
    await updatePassword({ password: 'a', new_password: 'b', extra: 1 })
    expect(apiPut).toHaveBeenCalledWith('/users/me/password', { password: 'a', new_password: 'b' })
  })
})
