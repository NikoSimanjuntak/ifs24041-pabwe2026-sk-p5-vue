import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import AddModal from './AddModal.vue'
import * as api from '../../api/aucationApi'
import { deferred, renderWithProviders, typeInEditor } from '@/test-utils'

vi.mock('../../api/aucationApi')

const CLOSED_AT = '2099-01-01T10:00'

async function fillForm(user, { title = 'Kamera Analog', description = 'Kamera tahun 1980', bid = '250000', closedAt = CLOSED_AT } = {}) {
  if (title) await user.type(screen.getByLabelText('Judul barang'), title)
  if (description) typeInEditor(description)
  if (bid) await user.type(screen.getByLabelText('Harga awal (Rp)'), bid)
  if (closedAt) await fireEvent.update(screen.getByLabelText('Ditutup pada'), closedAt)
}

describe('AddModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tidak merender apa pun saat tertutup, dan default prop open = false', async () => {
    await renderWithProviders(AddModal)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('menampilkan form saat terbuka', async () => {
    await renderWithProviders(AddModal, { props: { open: true } })
    expect(screen.getByRole('dialog', { name: 'Tambah lelang' })).toBeInTheDocument()
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
  })

  it('menampilkan semua pesan validasi', async () => {
    await renderWithProviders(AddModal, { props: { open: true } })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tambah lelang' }))
    expect(await screen.findByText('Judul wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Deskripsi wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Harga awal harus lebih dari 0.')).toBeInTheDocument()
    expect(screen.getByText('Batas waktu penutupan wajib diisi.')).toBeInTheDocument()
    expect(api.postAucation).not.toHaveBeenCalled()
  })

  it('menambah lelang: kirim data, tampilkan dialog, emit saved & close', async () => {
    api.postAucation.mockResolvedValue({})
    const { emitted } = await renderWithProviders(AddModal, { props: { open: true } })
    const user = userEvent.setup()
    await fillForm(user, { title: '  Kamera Analog ' })
    await user.click(screen.getByRole('button', { name: 'Tambah lelang' }))

    await waitFor(() => expect(emitted().saved).toHaveLength(1))
    expect(emitted().close).toHaveLength(1)
    expect(api.postAucation).toHaveBeenCalledWith({
      title: 'Kamera Analog',
      description: 'Kamera tahun 1980',
      start_bid: 250000,
      closed_at: new Date(CLOSED_AT).toISOString(),
    })
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }))
  })

  it('menampilkan dialog error saat gagal dan tidak menutup modal', async () => {
    api.postAucation.mockRejectedValue(new Error('Server error'))
    const { emitted } = await renderWithProviders(AddModal, { props: { open: true } })
    const user = userEvent.setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Tambah lelang' }))
    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Gagal menambah lelang', text: 'Server error' }),
      ),
    )
    expect(emitted().close).toBeUndefined()
  })

  it('menonaktifkan tombol saat menyimpan', async () => {
    const pending = deferred()
    api.postAucation.mockReturnValue(pending.promise)
    await renderWithProviders(AddModal, { props: { open: true } })
    const user = userEvent.setup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Tambah lelang' }))
    expect(await screen.findByRole('button', { name: 'Menyimpan…' })).toBeDisabled()
    pending.resolve({})
    expect(await screen.findByRole('button', { name: 'Tambah lelang' })).toBeEnabled()
  })

  it('tombol Batal dan X menutup modal', async () => {
    const { emitted } = await renderWithProviders(AddModal, { props: { open: true } })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(emitted().close).toHaveLength(2)
  })

  it('mengosongkan form setiap kali modal dibuka ulang', async () => {
    const { rerender } = await renderWithProviders(AddModal, { props: { open: true } })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Judul barang'), 'Sisa')
    await user.click(screen.getByRole('button', { name: 'Tambah lelang' }))
    expect(await screen.findByText('Deskripsi wajib diisi.')).toBeInTheDocument()
    await rerender({ open: false })
    await rerender({ open: true })
    expect(screen.getByLabelText('Judul barang')).toHaveValue('')
    expect(screen.queryByText('Deskripsi wajib diisi.')).not.toBeInTheDocument()
  })
})
