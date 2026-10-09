import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './authStore'
import * as authApi from '../api/authApi'
import { getAccessToken, putAccessToken } from '@/helpers/apiHelper'

vi.mock('../api/authApi')

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('membaca token tersimpan saat inisialisasi', () => {
    expect(useAuthStore().isAuthenticated).toBe(false)
    setActivePinia(createPinia())
    putAccessToken('stored')
    const store = useAuthStore()
    expect(store.token).toBe('stored')
    expect(store.isAuthenticated).toBe(true)
  })

  describe('validasi', () => {
    it('validateLogin', () => {
      const store = useAuthStore()
      expect(store.validateLogin({ email: 'x', password: '' })).toBe(false)
      expect(Object.keys(store.validation)).toEqual(['email', 'password'])
      expect(store.validateLogin({})).toBe(false)
      expect(store.validateLogin({ email: 'a@b.co', password: 'p' })).toBe(true)
      expect(store.validation).toEqual({})
    })

    it('validateRegister', () => {
      const store = useAuthStore()
      expect(store.validateRegister({})).toBe(false)
      expect(Object.keys(store.validation)).toEqual(['name', 'email', 'password'])
      expect(store.validateRegister({ name: ' ', email: 'a@b.co', password: '123456', confirmPassword: 'x' })).toBe(false)
      expect(Object.keys(store.validation)).toEqual(['name', 'confirmPassword'])
      expect(store.validateRegister({ name: 'A', email: 'a@b.co', password: '123456', confirmPassword: '123456' })).toBe(true)
    })
  })

  describe('login', () => {
    it('menyimpan token saat berhasil', async () => {
      authApi.login.mockResolvedValue({ data: { token: 'tkn' } })
      const store = useAuthStore()
      const promise = store.login({ email: 'a@b.co', password: 'p' })
      expect(store.isLoading).toBe(true)
      expect(await promise).toBe(true)
      expect(store.isLoading).toBe(false)
      expect(store.isAuthLogin).toBe(true)
      expect(store.token).toBe('tkn')
      expect(getAccessToken()).toBe('tkn')
    })

    it('berhenti bila validasi gagal', async () => {
      const store = useAuthStore()
      expect(await store.login({ email: '', password: '' })).toBe(false)
      expect(authApi.login).not.toHaveBeenCalled()
      expect(store.validation.email).toBeTruthy()
    })

    it('menyimpan pesan error saat API gagal', async () => {
      authApi.login.mockRejectedValue(new Error('Email atau sandi salah'))
      const store = useAuthStore()
      expect(await store.login({ email: 'a@b.co', password: 'p' })).toBe(false)
      expect(store.errorMessage).toBe('Email atau sandi salah')
      expect(store.isAuthLogin).toBe(false)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    const payload = { name: 'A', email: 'a@b.co', password: '123456', confirmPassword: '123456' }

    it('berhasil', async () => {
      authApi.register.mockResolvedValue({})
      const store = useAuthStore()
      expect(await store.register(payload)).toBe(true)
      expect(store.isAuthRegister).toBe(true)
    })

    it('berhenti bila validasi gagal', async () => {
      const store = useAuthStore()
      expect(await store.register({ ...payload, name: '' })).toBe(false)
      expect(authApi.register).not.toHaveBeenCalled()
    })

    it('menyimpan error saat API gagal', async () => {
      authApi.register.mockRejectedValue(new Error('Email dipakai'))
      const store = useAuthStore()
      expect(await store.register(payload)).toBe(false)
      expect(store.errorMessage).toBe('Email dipakai')
    })
  })

  it('logout menghapus token dan menandai isAuthLogout', () => {
    putAccessToken('x')
    setActivePinia(createPinia())
    const store = useAuthStore()
    store.logout()
    expect(store.token).toBe('')
    expect(store.isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(store.isAuthLogout).toBe(true)
  })

  it('resetStatus membersihkan flag', () => {
    const store = useAuthStore()
    store.isAuthLogin = true
    store.errorMessage = 'x'
    store.resetStatus()
    expect(store.isAuthLogin).toBe(false)
    expect(store.errorMessage).toBe('')
  })
})
