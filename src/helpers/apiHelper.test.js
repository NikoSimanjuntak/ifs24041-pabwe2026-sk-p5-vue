import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BASE_URL,
  TOKEN_KEY,
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  apiRequest,
  buildUrl,
  getAccessToken,
  putAccessToken,
} from './apiHelper'

const okResponse = (body = { success: true, data: {} }, status = 200) => ({
  ok: status < 400,
  status,
  json: () => Promise.resolve(body),
})

describe('apiHelper', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(okResponse())))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('memakai base URL dari konstanta DELCOM_BASEURL', () => {
    expect(BASE_URL).toBe('https://open-api.delcom.org/api/v1')
  })

  describe('token', () => {
    it('menyimpan, membaca, dan menghapus token', () => {
      expect(getAccessToken()).toBeNull()
      putAccessToken('abc')
      expect(localStorage.getItem(TOKEN_KEY)).toBe('abc')
      expect(getAccessToken()).toBe('abc')
      putAccessToken(null)
      expect(getAccessToken()).toBeNull()
    })
  })

  describe('buildUrl', () => {
    it('menggabungkan query dan mengabaikan nilai kosong', () => {
      const url = buildUrl('/aucations', { is_me: 1, a: undefined, b: null, c: '', is_closed: 0 })
      expect(url).toBe(`${BASE_URL}/aucations?is_me=1&is_closed=0`)
    })

    it('berfungsi tanpa query', () => {
      expect(buildUrl('/users')).toBe(`${BASE_URL}/users`)
    })
  })

  describe('apiRequest', () => {
    it('mengirim GET tanpa Authorization saat belum login', async () => {
      const json = await apiRequest('/users')
      const [, options] = fetch.mock.calls[0]
      expect(options.method).toBe('GET')
      expect(options.headers.Authorization).toBeUndefined()
      expect(options.body).toBeUndefined()
      expect(json).toEqual({ success: true, data: {} })
    })

    it('menyisipkan Bearer token dan query parameter', async () => {
      putAccessToken('tok')
      await apiRequest('/aucations', { query: { is_me: 1 } })
      const [url, options] = fetch.mock.calls[0]
      expect(url).toBe(`${BASE_URL}/aucations?is_me=1`)
      expect(options.headers.Authorization).toBe('Bearer tok')
    })

    it('mengirim body objek sebagai JSON', async () => {
      await apiRequest('/auth/login', { method: 'POST', body: { a: 1 } })
      const [, options] = fetch.mock.calls[0]
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(options.body).toBe('{"a":1}')
    })

    it('mengirim FormData apa adanya tanpa Content-Type', async () => {
      const form = new FormData()
      await apiRequest('/users/me/photo', { method: 'POST', body: form })
      const [, options] = fetch.mock.calls[0]
      expect(options.body).toBe(form)
      expect(options.headers['Content-Type']).toBeUndefined()
    })

    it('melempar error dengan pesan server dan status', async () => {
      fetch.mockResolvedValueOnce(okResponse({ success: false, message: 'Salah' }, 401))
      await expect(apiRequest('/x')).rejects.toMatchObject({ message: 'Salah', status: 401 })
    })

    it('melempar error bila success=false walau HTTP 200', async () => {
      fetch.mockResolvedValueOnce(okResponse({ success: false, message: 'Gagal' }))
      await expect(apiRequest('/x')).rejects.toThrow('Gagal')
    })

    it('memakai pesan bawaan bila respons bukan JSON', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) })
      await expect(apiRequest('/x')).rejects.toThrow('Permintaan gagal (500)')
    })
  })

  describe('shortcut', () => {
    it('memakai method HTTP yang tepat', async () => {
      await apiGet('/a', { q: 1 })
      await apiPost('/a', { x: 1 })
      await apiPut('/a', { x: 2 })
      await apiDelete('/a')
      expect(fetch.mock.calls.map(([, o]) => o.method)).toEqual(['GET', 'POST', 'PUT', 'DELETE'])
      expect(fetch.mock.calls[0][0]).toContain('?q=1')
    })
  })
})
