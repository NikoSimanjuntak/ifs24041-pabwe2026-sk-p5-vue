import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import ChangeCoverModal from './ChangeCoverModal.vue'
import * as api from '../../api/aucationApi'
import { deferred, renderWithProviders } from '@/test-utils'

vi.mock('../../api/aucationApi')

const aucation = { id: 7, title: 'Kamera', cover: 'https://img/lama.png' }
const mount = (props = {}) => renderWithProviders(ChangeCoverModal, { props: { open: true, aucation, ...props } })
const image = () => new File(['x'], 'baru.png', { type: 'image/png' })

describe('ChangeCoverModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:pratinjau')
  })

  it('tidak merender apa pun saat tertutup', async () => {
    await mount({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('menampilkan cover saat ini sebagai pratinjau', async () => {
    await mount()
    expect(screen.getByAltText('Pratinjau cover')).toHaveAttribute('src', 'https://img/lama.png')
  })

  it('menampilkan placeholder bila lelang belum punya cover', async () => {
    await mount({ aucation: { id: 7, title: 'Kamera' } })
    expect(screen.queryByAltText('Pratinjau cover')).not.toBeInTheDocument()
    expect(screen.getByText(/Belum ada gambar/)).toBeInTheDocument()
  })

  it('menampilkan pratinjau langsung setelah memilih gambar', async () => {
    await mount()
    await userEvent.setup().upload(screen.getByLabelText('Berkas cover'), image())
    expect(screen.getByAltText('Pratinjau cover')).toHaveAttribute('src', 'blob:pratinjau')
  })

  it('menolak berkas bukan gambar', async () => {
    await mount()
    const user = userEvent.setup({ applyAccept: false })
    await user.upload(screen.getByLabelText('Berkas cover'), new File(['x'], 'a.txt', { type: 'text/plain' }))
    expect(screen.getByText(/harus berupa gambar/)).toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('mengabaikan dialog pilih berkas yang dibatalkan', async () => {
    await mount()
    await fireEvent.change(screen.getByLabelText('Berkas cover'), { target: { files: [] } })
    expect(screen.queryByText(/harus berupa gambar/)).not.toBeInTheDocument()
  })

  it('meminta memilih gambar sebelum menyimpan', async () => {
    await mount()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Simpan cover' }))
    expect(await screen.findByText('Pilih gambar cover terlebih dahulu.')).toBeInTheDocument()
    expect(api.postCover).not.toHaveBeenCalled()
  })

  it('mengunggah cover: dialog sukses, emit saved & close', async () => {
    api.postCover.mockResolvedValue({})
    const { emitted } = await mount()
    const user = userEvent.setup()
    const file = image()
    await user.upload(screen.getByLabelText('Berkas cover'), file)
    await user.click(screen.getByRole('button', { name: 'Simpan cover' }))
    await waitFor(() => expect(emitted().saved).toHaveLength(1))
    expect(emitted().close).toHaveLength(1)
    expect(api.postCover).toHaveBeenCalledWith(7, file)
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }))
  })

  it('menampilkan dialog error saat unggah gagal dan status mengunggah', async () => {
    const pending = deferred()
    api.postCover.mockReturnValue(pending.promise)
    const { emitted } = await mount()
    const user = userEvent.setup()
    await user.upload(screen.getByLabelText('Berkas cover'), image())
    await user.click(screen.getByRole('button', { name: 'Simpan cover' }))
    expect(await screen.findByRole('button', { name: 'Mengunggah…' })).toBeDisabled()
    pending.reject(new Error('Ukuran terlalu besar'))
    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Gagal mengganti cover', text: 'Ukuran terlalu besar' }),
      ),
    )
    expect(emitted().close).toBeUndefined()
  })

  it('tombol Batal dan X menutup modal', async () => {
    const { emitted } = await mount()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    await user.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(emitted().close).toHaveLength(2)
  })

  it('mengatur ulang pilihan saat dibuka kembali', async () => {
    const { rerender } = await mount()
    await userEvent.setup().upload(screen.getByLabelText('Berkas cover'), image())
    await rerender({ open: false })
    await rerender({ open: true })
    expect(screen.getByAltText('Pratinjau cover')).toHaveAttribute('src', 'https://img/lama.png')
  })
})