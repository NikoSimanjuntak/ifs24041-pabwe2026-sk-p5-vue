import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import BidModal from './BidModal.vue'
import * as api from '../../api/aucationApi'
import { deferred, renderWithProviders } from '@/test-utils'

vi.mock('../../api/aucationApi')

const aucation = { id: 7, title: 'Kamera Analog', start_bid: 100000, bids: [{ id: 1, bid: 150000 }] }
const mount = (props = {}) => renderWithProviders(BidModal, { props: { open: true, aucation, ...props } })
const rp = (n) => new RegExp(`Rp.${n}`)

describe('BidModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tidak merender apa pun saat tertutup', async () => {
    await mount({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('menampilkan judul dan tawaran tertinggi saat ini', async () => {
    await mount()
    expect(screen.getByRole('dialog', { name: 'Ajukan tawaran' })).toBeInTheDocument()
    expect(screen.getByText('Kamera Analog')).toBeInTheDocument()
    expect(screen.getByText(rp('150.000'))).toBeInTheDocument()
  })

  it.each(['', '150000', '100000'])('menolak nominal %s yang tidak melebihi tawaran tertinggi', async (value) => {
    await mount()
    const user = userEvent.setup()
    if (value) await user.type(screen.getByLabelText('Nominal tawaranmu (Rp)'), value)
    await user.click(screen.getByRole('button', { name: 'Kirim tawaran' }))
    expect(await screen.findByText(/Tawaran harus lebih tinggi dari/)).toBeInTheDocument()
    expect(api.postBid).not.toHaveBeenCalled()
  })

  it('mengajukan tawaran yang valid', async () => {
    api.postBid.mockResolvedValue({})
    const { emitted } = await mount()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nominal tawaranmu (Rp)'), '175000')
    await user.click(screen.getByRole('button', { name: 'Kirim tawaran' }))
    await waitFor(() => expect(emitted().saved).toHaveLength(1))
    expect(emitted().close).toHaveLength(1)
    expect(api.postBid).toHaveBeenCalledWith(7, 175000)
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }))
  })

  it('tawaran pertama harus melebihi harga awal', async () => {
    await mount({ aucation: { id: 8, title: 'Sepeda', start_bid: 500000 } })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nominal tawaranmu (Rp)'), '500000')
    await user.click(screen.getByRole('button', { name: 'Kirim tawaran' }))
    expect(await screen.findByText(/lebih tinggi dari/)).toHaveTextContent(/500\.000/)
  })

  it('menampilkan dialog error saat gagal dan status mengirim', async () => {
    const pending = deferred()
    api.postBid.mockReturnValue(pending.promise)
    const { emitted } = await mount()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nominal tawaranmu (Rp)'), '200000')
    await user.click(screen.getByRole('button', { name: 'Kirim tawaran' }))
    expect(await screen.findByRole('button', { name: 'Mengirim…' })).toBeDisabled()
    pending.reject(new Error('Lelang sudah ditutup'))
    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', title: 'Gagal mengajukan tawaran', text: 'Lelang sudah ditutup' }),
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

  it('mengosongkan input dan error saat dibuka ulang', async () => {
    const { rerender } = await mount()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Nominal tawaranmu (Rp)'), '1')
    await user.click(screen.getByRole('button', { name: 'Kirim tawaran' }))
    expect(await screen.findByText(/lebih tinggi dari/)).toBeInTheDocument()
    await rerender({ open: false })
    await rerender({ open: true })
    expect(screen.getByLabelText('Nominal tawaranmu (Rp)')).toHaveValue(null)
    expect(screen.queryByText(/lebih tinggi dari/)).not.toBeInTheDocument()
  })
})
