import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import defaultRouter, { authGuard, createAppRouter, routes } from './router'
import { putAccessToken } from '@/helpers/apiHelper'

const makeRouter = () => createAppRouter(createMemoryHistory())
const go = async (router, path) => {
  await router.push(path)
  await router.isReady()
  return router.currentRoute.value
}

describe('router', () => {
  it('menyediakan router bawaan', () => {
    expect(defaultRouter.getRoutes().length).toBeGreaterThan(0)
  })

  it('mendeklarasikan semua rute yang dibutuhkan', () => {
    const router = makeRouter()
    const paths = router.getRoutes().map((r) => r.path)
    ;['/auth/login', '/auth/register', '/', '/aucations/:aucationId', '/users', '/profile', '/:pathMatch(.*)*'].forEach((p) =>
      expect(paths).toContain(p),
    )
    expect(routes).toHaveLength(3)
  })

  describe('authGuard', () => {
    it('mengizinkan rute publik', () => {
      expect(authGuard({ meta: {} })).toBe(true)
    })

    it('mengarahkan tamu dari rute terlindungi ke login', () => {
      expect(authGuard({ meta: { requiresAuth: true } })).toEqual({ name: 'login' })
    })

    it('mengarahkan pengguna login dari halaman auth ke beranda', () => {
      putAccessToken('jwt')
      expect(authGuard({ meta: { guestOnly: true } })).toEqual({ name: 'home' })
      expect(authGuard({ meta: { requiresAuth: true } })).toBe(true)
    })
  })

  describe('navigasi', () => {
    it('tamu: / -> /auth/login', async () => {
      expect((await go(makeRouter(), '/')).path).toBe('/auth/login')
    })

    it('tamu: /auth membuka login dan register', async () => {
      const router = makeRouter()
      expect((await go(router, '/auth')).path).toBe('/auth/login')
      expect((await go(router, '/auth/register')).name).toBe('register')
    })

    it('pengguna login: halaman terlindungi dapat dibuka', async () => {
      putAccessToken('jwt')
      const router = makeRouter()
      expect((await go(router, '/')).name).toBe('home')
      const detail = await go(router, '/aucations/12')
      expect(detail.name).toBe('detail')
      expect(detail.params.aucationId).toBe('12')
      expect((await go(router, '/users')).name).toBe('users')
      expect((await go(router, '/profile')).name).toBe('profile')
    })

    it('pengguna login: /auth/login -> beranda', async () => {
      putAccessToken('jwt')
      expect((await go(makeRouter(), '/auth/login')).name).toBe('home')
    })

    it('rute tak dikenal -> halaman 404', async () => {
      expect((await go(makeRouter(), '/tidak/ada')).name).toBe('not-found')
    })
  })
})
