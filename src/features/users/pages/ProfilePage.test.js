import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import ProfilePage from './ProfilePage.vue'
import * as userApi from '../api/userApi'
import { deferred, renderWithProviders } from '@/test-utils'

vi.mock('../api/userApi')

const profile = { id: 'u1', name: 'Ani', email: 'ani@mail.com', photo: 'https://img/ani.png' }
const withProfile = (p = profile) => ({ initialState: { users: { profile: p } } })

const dialog = (props) => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining(props))

describe('ProfilePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan data profil pada form dan foto', async () => {
    await renderWithProviders(ProfilePage, withProfile())
    expect(screen.getByLabelText('Nama')).toHaveValue('Ani')
    expect(screen.getByLabelText('Email')).toHaveValue('ani@mail.com')
    expect(screen.getByAltText('Foto profil')).toHaveAttribute('src', 'https://img/ani.png')
    expect(userApi.getMe).not.toHaveBeenCalled()
  })

  it('memuat profil bila belum ada dan memakai inisial tanpa foto', async () => {
    userApi.getMe.mockResolvedValue({ data: { user: { id: 'u1', name: 'budi', email: 'b@mail.com' } } })
    await renderWithProviders(ProfilePage)
    expect(screen.getByText('?')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('Nama')).toHaveValue('budi'))
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('menampilkan error saat gagal memuat profil', async () => {
    userApi.getMe.mockRejectedValue(new Error('Token kedaluwarsa'))
    await renderWithProviders(ProfilePage)
    await waitFor(() => dialog({ icon: 'error', title: 'Gagal memuat profil', text: 'Token kedaluwarsa' }))
  })

  describe('data akun', () => {
    it('validasi nama dan email', async () => {
      await renderWithProviders(ProfilePage, withProfile())
      const user = userEvent.setup()
      await user.clear(screen.getByLabelText('Nama'))
      await user.clear(screen.getByLabelText('Email'))
      await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
      expect(await screen.findByText('Nama wajib diisi.')).toBeInTheDocument()
      expect(screen.getByText('Masukkan alamat email yang valid.')).toBeInTheDocument()
      expect(userApi.updateMe).not.toHaveBeenCalled()
    })

    it('menyimpan perubahan', async () => {
      userApi.updateMe.mockResolvedValue({})
      await renderWithProviders(ProfilePage, withProfile())
      const user = userEvent.setup()
      await user.clear(screen.getByLabelText('Nama'))
      await user.type(screen.getByLabelText('Nama'), '  Ani Baru ')
      await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
      await waitFor(() => dialog({ icon: 'success', text: 'Profilmu sudah diperbarui.' }))
      expect(userApi.updateMe).toHaveBeenCalledWith({ name: 'Ani Baru', email: 'ani@mail.com' })
    })

    it('menampilkan error saat gagal menyimpan', async () => {
      userApi.updateMe.mockRejectedValue(new Error('Email dipakai'))
      await renderWithProviders(ProfilePage, withProfile())
      await fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
      await waitFor(() => dialog({ icon: 'error', title: 'Gagal memperbarui profil', text: 'Email dipakai' }))
    })

    it('menampilkan status menyimpan', async () => {
      const pending = deferred()
      userApi.updateMe.mockReturnValue(pending.promise)
      await renderWithProviders(ProfilePage, withProfile())
      await fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
      expect(await screen.findByRole('button', { name: 'Menyimpan…' })).toBeDisabled()
      pending.resolve({})
      expect(await screen.findByRole('button', { name: 'Simpan perubahan' })).toBeEnabled()
    })
  })

  describe('foto profil', () => {
    it('mengabaikan bila tidak ada berkas dipilih', async () => {
      await renderWithProviders(ProfilePage, withProfile())
      await fireEvent.change(screen.getByLabelText('Unggah foto profil'), { target: { files: [] } })
      expect(userApi.updatePhoto).not.toHaveBeenCalled()
    })

    it('mengunggah foto lalu memuat ulang profil', async () => {
      userApi.updatePhoto.mockResolvedValue({})
      userApi.getMe.mockResolvedValue({ data: { user: { ...profile, photo: 'https://img/baru.png' } } })
      await renderWithProviders(ProfilePage, withProfile())
      const file = new File(['x'], 'baru.png', { type: 'image/png' })
      await userEvent.setup().upload(screen.getByLabelText('Unggah foto profil'), file)
      await waitFor(() => dialog({ icon: 'success', text: 'Foto profil sudah diganti.' }))
      expect(userApi.updatePhoto).toHaveBeenCalledWith(file)
      await waitFor(() => expect(screen.getByAltText('Foto profil')).toHaveAttribute('src', 'https://img/baru.png'))
    })

    it('menampilkan error saat unggah gagal dan status mengunggah', async () => {
      const pending = deferred()
      userApi.updatePhoto.mockReturnValue(pending.promise)
      await renderWithProviders(ProfilePage, withProfile())
      const file = new File(['x'], 'baru.png', { type: 'image/png' })
      await userEvent.setup().upload(screen.getByLabelText('Unggah foto profil'), file)
      expect(await screen.findByText('Mengunggah…')).toBeInTheDocument()
      pending.reject(new Error('Terlalu besar'))
      await waitFor(() => dialog({ icon: 'error', title: 'Gagal mengunggah foto', text: 'Terlalu besar' }))
      expect(screen.getByText('Ganti foto')).toBeInTheDocument()
    })
  })

  describe('kata sandi', () => {
    const fill = async (user, cur, next, confirm) => {
      if (cur) await user.type(screen.getByLabelText('Kata sandi saat ini'), cur)
      if (next) await user.type(screen.getByLabelText('Kata sandi baru'), next)
      if (confirm) await user.type(screen.getByLabelText('Konfirmasi kata sandi baru'), confirm)
    }

    it('validasi form kata sandi', async () => {
      await renderWithProviders(ProfilePage, withProfile())
      const user = userEvent.setup()
      await fill(user, '', '123', '456')
      await user.click(screen.getByRole('button', { name: 'Ganti kata sandi' }))
      expect(await screen.findByText('Kata sandi saat ini wajib diisi.')).toBeInTheDocument()
      expect(screen.getByText('Kata sandi baru minimal 6 karakter.')).toBeInTheDocument()
      expect(screen.getByText('Konfirmasi kata sandi tidak sama.')).toBeInTheDocument()
      expect(userApi.updatePassword).not.toHaveBeenCalled()
    })

    it('berhasil mengganti dan mengosongkan form', async () => {
      userApi.updatePassword.mockResolvedValue({})
      await renderWithProviders(ProfilePage, withProfile())
      const user = userEvent.setup()
      await fill(user, 'lama123', 'baru1234', 'baru1234')
      await user.click(screen.getByRole('button', { name: 'Ganti kata sandi' }))
      await waitFor(() => dialog({ icon: 'success', text: 'Kata sandi sudah diganti.' }))
      expect(userApi.updatePassword).toHaveBeenCalledWith({ password: 'lama123', new_password: 'baru1234' })
      expect(screen.getByLabelText('Kata sandi saat ini')).toHaveValue('')
      expect(screen.getByLabelText('Kata sandi baru')).toHaveValue('')
    })

    it('menampilkan error dan status menyimpan', async () => {
      const pending = deferred()
      userApi.updatePassword.mockReturnValue(pending.promise)
      await renderWithProviders(ProfilePage, withProfile())
      const user = userEvent.setup()
      await fill(user, 'lama123', 'baru1234', 'baru1234')
      await user.click(screen.getByRole('button', { name: 'Ganti kata sandi' }))
      expect(await screen.findByRole('button', { name: 'Menyimpan…' })).toBeDisabled()
      pending.reject(new Error('Sandi lama salah'))
      await waitFor(() => dialog({ icon: 'error', title: 'Gagal mengganti kata sandi', text: 'Sandi lama salah' }))
    })
  })
})
