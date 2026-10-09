import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import NavbarComponent from './NavbarComponent.vue'
import { useAuthStore } from '@/features/auth/states/authStore'
import { useUsersStore } from '@/features/users/states/usersStore'
import { putAccessToken } from '@/helpers/apiHelper'
import { renderWithProviders, stubPage } from '@/test-utils'

const routes = [
  { path: '/', component: stubPage('Beranda') },
  { path: '/profile', component: stubPage('Profil') },
  { path: '/auth/login', component: stubPage('Login') },
]
const profile = { id: 'u1', name: 'Ani', email: 'ani@mail.com', photo: 'https://img/ani.png' }
const setup = (user = profile) => renderWithProviders(NavbarComponent, { routes, initialState: { users: { profile: user } } })

describe('NavbarComponent', () => {
  beforeEach(() => putAccessToken('jwt'))

  it('menampilkan identitas akun aktif dengan foto', async () => {
    await setup()
    expect(screen.getByText('Ani')).toBeInTheDocument()
    expect(screen.getByText('ani@mail.com')).toBeInTheDocument()
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://img/ani.png')
  })

  it('memakai inisial bila tanpa foto dan placeholder saat profil belum dimuat', async () => {
    const { unmount } = await setup({ id: 'u1', name: 'budi', email: 'b@mail.com' })
    expect(screen.getByText('B')).toBeInTheDocument()
    unmount()
    await renderWithProviders(NavbarComponent, { routes })
    expect(screen.getByText('Memuat…')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('mengirim event toggle-sidebar', async () => {
    const { emitted } = await setup()
    await userEvent.setup().click(screen.getByLabelText('Buka menu navigasi'))
    expect(emitted()['toggle-sidebar']).toHaveLength(1)
  })

  it('membuka dan menutup menu cepat', async () => {
    await setup()
    const user = userEvent.setup()
    const trigger = screen.getByLabelText('Menu cepat akun')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(trigger)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('menutup menu cepat saat memilih tautan', async () => {
    const { router } = await setup()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Menu cepat akun'))
    await user.click(screen.getByRole('menuitem', { name: 'Profil saya' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/profile'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Menu cepat akun'))
    await user.click(screen.getByRole('menuitem', { name: 'Dashboard lelang' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('logout setelah konfirmasi: hapus sesi dan kembali ke login', async () => {
    const { router, pinia } = await setup()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/auth/login'))
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Keluar dari akun?' }))
    expect(useAuthStore(pinia).isAuthLogout).toBe(true)
    expect(localStorage.getItem('delcom_access_token')).toBeNull()
    expect(useUsersStore(pinia).profile).toBeNull()
  })

  it('tidak logout bila dibatalkan', async () => {
    Swal.fire.mockResolvedValueOnce({ isConfirmed: false })
    const { router, pinia } = await setup()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(Swal.fire).toHaveBeenCalled())
    expect(router.currentRoute.value.path).toBe('/')
    expect(useAuthStore(pinia).isAuthLogout).toBe(false)
    expect(useUsersStore(pinia).profile).not.toBeNull()
  })
})
