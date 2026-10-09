import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import * as authApi from '@/features/auth/api/authApi'
import * as userApi from '@/features/users/api/userApi'
import * as aucationApi from '@/features/aucations/api/aucationApi'
import { putAccessToken } from '@/helpers/apiHelper'
import { renderWithProviders } from './test-utils'

vi.mock('@/features/auth/api/authApi')
vi.mock('@/features/users/api/userApi')
vi.mock('@/features/aucations/api/aucationApi')

const me = { id: 'u1', name: 'Ani Wijaya', email: 'ani@mail.com' }
const aucation = {
  id: 1, title: 'Kamera Analog', description: 'Lensa 50mm', start_bid: 100000,
  closed_at: '2099-01-01T00:00:00Z', user_id: 'other', bids: [],
}

const mount = (route = '/') =>
  renderWithProviders(App, { route, router: createAppRouter(createMemoryHistory()) })

describe('App (integrasi)', () => {
  beforeEach(() => {
    userApi.getMe.mockResolvedValue({ data: { user: me } })
    userApi.getUsers.mockResolvedValue({ data: { users: [me, { id: 'u2', name: 'Budi', email: 'budi@mail.com' }] } })
    aucationApi.getAucations.mockResolvedValue({ data: { aucations: [aucation] } })
    aucationApi.getAucation.mockResolvedValue({ data: { aucation } })
  })

  it('tamu diarahkan ke halaman login', async () => {
    const { router } = await mount('/')
    expect(router.currentRoute.value.path).toBe('/auth/login')
    expect(await screen.findByRole('heading', { name: 'Masuk ke akunmu' })).toBeInTheDocument()
  })

  it('alur lengkap: login -> dashboard', async () => {
    authApi.login.mockResolvedValue({ data: { token: 'jwt' } })
    const { router } = await mount('/')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'ani@mail.com')
    await user.type(screen.getByLabelText('Kata sandi'), 'rahasia')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    expect(await screen.findByText('Kamera Analog')).toBeInTheDocument()
    expect(await screen.findByText('Ani Wijaya')).toBeInTheDocument()
  })

  it('pengguna login menjelajah dashboard -> detail -> pengguna -> profil', async () => {
    putAccessToken('jwt')
    await mount('/')
    const user = userEvent.setup()
    await screen.findByText('Kamera Analog')

    await user.click(screen.getByRole('link', { name: 'Lihat detail' }))
    expect(await screen.findByRole('heading', { name: 'Kamera Analog' })).toBeInTheDocument()

    const nav = screen.getByLabelText('Navigasi utama')
    await user.click(within(nav).getByRole('link', { name: 'Daftar Pengguna' }))
    expect(await screen.findByText('budi@mail.com')).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: 'Profil Saya' }))
    expect(await screen.findByRole('heading', { name: 'Profil saya' })).toBeInTheDocument()
  })

  it('rute tak dikenal menampilkan halaman 404', async () => {
    putAccessToken('jwt')
    await mount('/halaman/hilang')
    expect(await screen.findByText('Halaman tidak ditemukan')).toBeInTheDocument()
  })

  it('logout mengembalikan ke halaman login', async () => {
    putAccessToken('jwt')
    const { router } = await mount('/')
    await screen.findByText('Ani Wijaya')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/auth/login'))
    expect(localStorage.getItem('delcom_access_token')).toBeNull()
  })
})
