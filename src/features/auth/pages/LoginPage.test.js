import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import LoginPage from './LoginPage.vue'
import * as authApi from '../api/authApi'
import { deferred, renderWithProviders, stubPage } from '@/test-utils'
import { getAccessToken } from '@/helpers/apiHelper'

vi.mock('../api/authApi')

const routes = [
  { path: '/', component: stubPage('Beranda') },
  { path: '/auth/login', component: LoginPage },
  { path: '/auth/register', component: stubPage('Daftar') },
]

const setup = () => renderWithProviders(LoginPage, { route: '/auth/login', routes })

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan form dan tautan registrasi', async () => {
    await setup()
    expect(screen.getByRole('heading', { name: 'Masuk ke akunmu' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Kata sandi')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Daftar sekarang' })).toHaveAttribute('href', '/auth/register')
  })

  it('menampilkan pesan validasi bila form kosong', async () => {
    await setup()
    await fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByText('Masukkan alamat email yang valid.')).toBeInTheDocument()
    expect(screen.getByText('Kata sandi wajib diisi.')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
    expect(Swal.fire).not.toHaveBeenCalled()
  })

  it('login berhasil: simpan token, tampilkan dialog, pindah ke beranda', async () => {
    authApi.login.mockResolvedValue({ data: { token: 'jwt-token' } })
    const { router } = await setup()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'ani@mail.com')
    await user.type(screen.getByLabelText('Kata sandi'), 'rahasia')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    expect(authApi.login).toHaveBeenCalledWith({ email: 'ani@mail.com', password: 'rahasia' })
    expect(getAccessToken()).toBe('jwt-token')
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', title: 'Login berhasil' }))
  })

  it('login gagal menampilkan dialog error', async () => {
    authApi.login.mockRejectedValue(new Error('Email atau kata sandi salah'))
    const { router } = await setup()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'ani@mail.com')
    await user.type(screen.getByLabelText('Kata sandi'), 'salah')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Login gagal', text: 'Email atau kata sandi salah' }),
      ),
    )
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('menonaktifkan tombol saat memproses', async () => {
    const pending = deferred()
    authApi.login.mockReturnValue(pending.promise)
    await setup()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'ani@mail.com')
    await user.type(screen.getByLabelText('Kata sandi'), 'rahasia')
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('button', { name: 'Memproses…' })).toBeDisabled()
    pending.reject(new Error('x'))
    expect(await screen.findByRole('button', { name: 'Masuk' })).toBeEnabled()
  })
})
