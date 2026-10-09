import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import App from '@/App.vue'
import AucationLayout from './AucationLayout.vue'
import * as userApi from '@/features/users/api/userApi'
import { putAccessToken } from '@/helpers/apiHelper'
import { renderWithProviders, stubPage } from '@/test-utils'

vi.mock('@/features/users/api/userApi')

const routes = [
  { path: '/', component: AucationLayout, children: [{ path: '', component: stubPage('Isi halaman') }] },
  { path: '/users', component: stubPage('Pengguna') },
  { path: '/profile', component: stubPage('Profil') },
  { path: '/auth/login', component: stubPage('Halaman login') },
]

describe('AucationLayout', () => {
  beforeEach(() => putAccessToken('jwt'))

  it('menyusun navbar, sidebar, dan konten rute', async () => {
    userApi.getMe.mockResolvedValue({ data: { user: { id: 'u1', name: 'Ani', email: 'ani@mail.com' } } })
    await renderWithProviders(App, { routes })
    expect(await screen.findByText('Ani')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByText('Isi halaman')).toBeInTheDocument()
    expect(userApi.getMe).toHaveBeenCalledTimes(1)
  })

  it('membuka dan menutup drawer sidebar dari navbar', async () => {
    userApi.getMe.mockResolvedValue({ data: { user: { id: 'u1', name: 'Ani', email: 'a@b.co' } } })
    await renderWithProviders(App, { routes })
    const user = userEvent.setup()
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Buka menu navigasi'))
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
    await user.click(screen.getByTestId('sidebar-backdrop'))
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Buka menu navigasi'))
    await user.click(screen.getByLabelText('Buka menu navigasi'))
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('keluar otomatis bila profil gagal dimuat (token tidak valid)', async () => {
    userApi.getMe.mockRejectedValue(new Error('Unauthorized'))
    const { router } = await renderWithProviders(App, { routes })
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/auth/login'))
    expect(localStorage.getItem('delcom_access_token')).toBeNull()
  })
})
