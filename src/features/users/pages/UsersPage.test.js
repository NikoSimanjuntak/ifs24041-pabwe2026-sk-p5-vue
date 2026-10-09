import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import UsersPage from './UsersPage.vue'
import * as userApi from '../api/userApi'
import { deferred, renderWithProviders } from '@/test-utils'

vi.mock('../api/userApi')

const users = [
  { id: 1, name: 'Ani Wijaya', email: 'ani@mail.com', photo: 'https://img/ani.png' },
  { id: 2, name: 'budi', email: 'budi@mail.com' },
  { id: 3, email: 'anon@mail.com' },
  { id: 4, name: 'Tanpa Email' },
]

describe('UsersPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menampilkan daftar pengguna dengan foto atau inisial', async () => {
    userApi.getUsers.mockResolvedValue({ data: { users } })
    await renderWithProviders(UsersPage)
    expect(await screen.findByText('Ani Wijaya')).toBeInTheDocument()
    expect(screen.getByAltText('Foto Ani Wijaya')).toHaveAttribute('src', 'https://img/ani.png')
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
    expect(screen.getByText('Tanpa Email')).toBeInTheDocument()
  })

  it('menampilkan status memuat', async () => {
    const pending = deferred()
    userApi.getUsers.mockReturnValue(pending.promise)
    await renderWithProviders(UsersPage)
    expect(screen.getByText('Memuat pengguna…')).toBeInTheDocument()
    pending.resolve({ data: { users: [] } })
    await waitFor(() => expect(screen.queryByText('Memuat pengguna…')).not.toBeInTheDocument())
  })

  it('mencari pengguna secara langsung dan menampilkan keadaan kosong', async () => {
    userApi.getUsers.mockResolvedValue({ data: { users } })
    await renderWithProviders(UsersPage)
    await screen.findByText('Ani Wijaya')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Cari pengguna'), 'budi')
    expect(screen.queryByText('Ani Wijaya')).not.toBeInTheDocument()
    expect(screen.getByText('budi')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Cari pengguna'))
    await user.type(screen.getByLabelText('Cari pengguna'), 'tidak-ada')
    expect(screen.getByText('Pengguna tidak ditemukan')).toBeInTheDocument()
  })

  it('menampilkan dialog error bila gagal memuat', async () => {
    userApi.getUsers.mockRejectedValue(new Error('Server mati'))
    await renderWithProviders(UsersPage)
    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Gagal memuat pengguna', text: 'Server mati' }),
      ),
    )
  })
})
