import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import RegisterPage from './RegisterPage.vue'
import * as authApi from '../api/authApi'
import { deferred, renderWithProviders, stubPage } from '@/test-utils'

vi.mock('../api/authApi')

const routes = [
  { path: '/auth/login', component: stubPage('Login') },
  { path: '/auth/register', component: RegisterPage },
]
const setup = () => renderWithProviders(RegisterPage, { route: '/auth/register', routes })

async function fillForm(user, { name = 'Ani', email = 'ani@mail.com', password = 'rahasia', confirm = 'rahasia' } = {}) {
  if (name) await user.type(screen.getByLabelText('Nama lengkap'), name)
  if (email) await user.type(screen.getByLabelText('Email'), email)
  if (password) await user.type(screen.getByLabelText('Kata sandi'), password)
  if (confirm) await user.type(screen.getByLabelText('Konfirmasi kata sandi'), confirm)
}

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan form dan tautan login', async () => {
    await setup()
    expect(screen.getByRole('heading', { name: 'Buat akun baru' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/auth/login')
  })

  it('menampilkan seluruh pesan validasi', async () => {
    await setup()
    const user = userEvent.setup()
    await fillForm(user, { name: '', email: 'salah', password: '123', confirm: '456' })
    await fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByText('Nama wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Masukkan alamat email yang valid.')).toBeInTheDocument()
    expect(screen.getByText('Kata sandi minimal 6 karakter.')).toBeInTheDocument()
    expect(screen.getByText('Konfirmasi kata sandi tidak sama.')).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()
    expect(Swal.fire).not.toHaveBeenCalled()
  })

  it('registrasi berhasil: dialog sukses lalu ke halaman login', async () => {
    authApi.register.mockResolvedValue({})
    const { router } = await setup()
    const user = userEvent.setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/auth/login'))
    expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ani', email: 'ani@mail.com', password: 'rahasia' }))
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success', title: 'Registrasi berhasil' }))
  })

  it('registrasi gagal menampilkan dialog error', async () => {
    authApi.register.mockRejectedValue(new Error('Email sudah terdaftar'))
    const { router } = await setup()
    const user = userEvent.setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Registrasi gagal', text: 'Email sudah terdaftar' }),
      ),
    )
    expect(router.currentRoute.value.path).toBe('/auth/register')
  })

  it('menonaktifkan tombol saat memproses', async () => {
    const pending = deferred()
    authApi.register.mockReturnValue(pending.promise)
    await setup()
    const user = userEvent.setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByRole('button', { name: 'Memproses…' })).toBeDisabled()
    pending.reject(new Error('x'))
    expect(await screen.findByRole('button', { name: 'Daftar' })).toBeEnabled()
  })
})
