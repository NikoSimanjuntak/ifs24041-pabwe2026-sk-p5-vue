import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUsersStore } from './usersStore'
import * as userApi from '../api/userApi'

vi.mock('../api/userApi')

describe('usersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetchUsers mengisi daftar pengguna', async () => {
    userApi.getUsers.mockResolvedValue({ data: { users: [{ id: 1 }] } })
    const store = useUsersStore()
    const promise = store.fetchUsers({ q: 1 })
    expect(store.isLoading).toBe(true)
    expect(await promise).toBe(true)
    expect(store.users).toEqual([{ id: 1 }])
    expect(store.isLoading).toBe(false)
    expect(userApi.getUsers).toHaveBeenCalledWith({ q: 1 })
  })

  it('fetchUsers menyimpan pesan error', async () => {
    userApi.getUsers.mockRejectedValue(new Error('Gagal'))
    const store = useUsersStore()
    expect(await store.fetchUsers()).toBe(false)
    expect(store.errorMessage).toBe('Gagal')
  })

  it('fetchProfile mengisi profile dan user', async () => {
    userApi.getMe.mockResolvedValue({ data: { user: { id: 1, name: 'A' } } })
    const store = useUsersStore()
    expect(await store.fetchProfile()).toBe(true)
    expect(store.profile).toEqual({ id: 1, name: 'A' })
    expect(store.user).toEqual({ id: 1, name: 'A' })
  })

  it('changeProfile memperbarui profil lokal saat berhasil', async () => {
    userApi.updateMe.mockResolvedValue({})
    const store = useUsersStore()
    store.profile = { id: 1, name: 'A', email: 'a@b.co' }
    const promise = store.changeProfile({ name: 'B', email: 'b@b.co' })
    expect(store.isProfileChange).toBe(true)
    expect(await promise).toBe(true)
    expect(store.profile).toEqual({ id: 1, name: 'B', email: 'b@b.co' })
    expect(store.isProfileChanged).toBe(true)
    expect(store.isProfileChange).toBe(false)
  })

  it('changeProfile gagal', async () => {
    userApi.updateMe.mockRejectedValue(new Error('Ditolak'))
    const store = useUsersStore()
    expect(await store.changeProfile({})).toBe(false)
    expect(store.isProfileChanged).toBe(false)
    expect(store.errorMessage).toBe('Ditolak')
  })

  it('changePhoto memuat ulang profil saat berhasil', async () => {
    userApi.updatePhoto.mockResolvedValue({})
    userApi.getMe.mockResolvedValue({ data: { user: { id: 1, photo: 'p.png' } } })
    const store = useUsersStore()
    const file = new File(['x'], 'p.png')
    expect(await store.changePhoto(file)).toBe(true)
    expect(userApi.updatePhoto).toHaveBeenCalledWith(file)
    expect(store.isPhotoChanged).toBe(true)
    expect(store.profile.photo).toBe('p.png')
  })

  it('changePhoto gagal', async () => {
    userApi.updatePhoto.mockRejectedValue(new Error('Terlalu besar'))
    const store = useUsersStore()
    expect(await store.changePhoto(new File(['x'], 'p.png'))).toBe(false)
    expect(store.isPhotoChanged).toBe(false)
    expect(userApi.getMe).not.toHaveBeenCalled()
  })

  it('changePassword menandai hasil', async () => {
    userApi.updatePassword.mockResolvedValue({})
    const store = useUsersStore()
    expect(await store.changePassword({ password: 'a', new_password: 'b' })).toBe(true)
    expect(store.isPasswordChanged).toBe(true)
    userApi.updatePassword.mockRejectedValue(new Error('Sandi salah'))
    expect(await store.changePassword({})).toBe(false)
    expect(store.isPasswordChanged).toBe(false)
    expect(store.errorMessage).toBe('Sandi salah')
  })

  it('resetStatus membersihkan flag hasil', () => {
    const store = useUsersStore()
    store.isProfileChanged = true
    store.isPhotoChanged = true
    store.isPasswordChanged = true
    store.errorMessage = 'x'
    store.resetStatus()
    expect([store.isProfileChanged, store.isPhotoChanged, store.isPasswordChanged, store.errorMessage]).toEqual([false, false, false, ''])
  })
})
