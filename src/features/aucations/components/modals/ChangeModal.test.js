import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import Editor from '@toast-ui/editor'
import ChangeModal from './ChangeModal.vue'
import * as api from '../../api/aucationApi'
import { deferred, renderWithProviders, typeInEditor } from '@/test-utils'
import { toDateTimeLocal } from '@/helpers/toolsHelper'

vi.mock('../../api/aucationApi')

const aucation = {
  id: 7,
  title: 'Kamera Analog',
  description: 'Deskripsi lama',
  start_bid: 250000,
  closed_at: '2099-01-01T10:00:00.000Z',
}
const mount = (props = {}) => renderWithProviders(ChangeModal, { props: { open: true, aucation, ...props } })

describe('ChangeModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tidak merender apa pun saat tertutup', async () => {
    await mount({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('menampilkan data lelang pada form', async () => {
    await mount()
    expect(screen.getByRole('dialog', { name: 'Ubah lelang' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul barang')).toHaveValue('Kamera Analog')
    expect(screen.getByLabelText('Harga awal (Rp)')).toHaveValue(250000)
    expect(screen.getByLabelText('Ditutup pada')).toHaveValue(toDateTimeLocal(aucation.closed_at))
    expect(Editor.instances.at(-1).getMarkdown()).toBe('Deskripsi lama')
  })

  it('menampilkan pesan validasi saat data dikosongkan', async () => {
    await mount()
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText('Judul barang'))
    await user.clear(screen.getByLabelText('Harga awal (Rp)'))
    typeInEditor('')
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
    expect(await screen.findByText('Judul wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Deskripsi wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Harga awal harus lebih dari 0.')).toBeInTheDocument()
    expect(api.putAucation).not.toHaveBeenCalled()
  })

  it('menolak batas waktu penutupan di masa lalu', async () => {
    await mount()
    await fireEvent.update(screen.getByLabelText('Ditutup pada'), '2000-01-01T10:00')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Simpan perubahan' }))
    expect(await screen.findByText('Batas waktu harus di masa depan.')).toBeInTheDocument()
    expect(api.putAucation).not.toHaveBeenCalled()
  })

  it('menyimpan perubahan: kirim data, dialog sukses, emit saved & close', async () => {
    api.putAucation.mockResolvedValue({})
    const { emitted } = await mount()
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText('Judul barang'))
    await user.type(screen.getByLabelText('Judul barang'), 'Kamera Rangefinder')
    typeInEditor('Deskripsi baru')
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))

    await waitFor(() => expect(emitted().saved).toHaveLength(1))
    expect(emitted().close).toHaveLength(1)
    expect(api.putAucation).toHaveBeenCalledWith(7, {
      title: 'Kamera Rangefinder',
      description: 'Deskripsi baru',
      start_bid: 250000,
      closed_at: new Date(toDateTimeLocal(aucation.closed_at)).toISOString(),
    })
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }))
  })

  it('menampilkan dialog error saat gagal', async () => {
    api.putAucation.mockRejectedValue(new Error('Bukan pemilik'))
    const { emitted } = await mount()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Simpan perubahan' }))
    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Gagal mengubah lelang', text: 'Bukan pemilik' }),
      ),
    )
    expect(emitted().close).toBeUndefined()
  })

  it('menampilkan status menyimpan', async () => {
    const pending = deferred()
    api.putAucation.mockReturnValue(pending.promise)
    await mount()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Simpan perubahan' }))
    expect(await screen.findByRole('button', { name: 'Menyimpan…' })).toBeDisabled()
    pending.resolve({})
    expect(await screen.findByRole('button', { name: 'Simpan perubahan' })).toBeEnabled()
  })

  it('tombol Batal dan X menutup modal', async () => {
    const { emitted } = await mount()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(emitted().close).toHaveLength(2)
  })

  it('memuat ulang data lelang setiap modal dibuka', async () => {
    const { rerender } = await mount()
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText('Judul barang'))
    await user.type(screen.getByLabelText('Judul barang'), 'Diubah')
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await rerender({ open: false })
    await rerender({ open: true })
    expect(screen.getByLabelText('Judul barang')).toHaveValue('Kamera Analog')
  })
})
