import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import HomePage from './HomePage.vue'
import * as api from '../api/aucationApi'
import { deferred, renderWithProviders, stubPage, typeInEditor } from '@/test-utils'

vi.mock('../api/aucationApi')

const items = [
  {
    id: 1, title: 'Kamera Analog', description: '**Lensa** 50mm', start_bid: 100000, cover: 'https://img/1.png',
    closed_at: '2099-01-01T00:00:00Z', user_id: 'other', bids: [{ id: 'b1', bid: 150000 }],
  },
  { id: 2, title: 'Sepeda Lipat', description: 'Bekas pakai', start_bid: 500000, closed_at: '2000-01-01T00:00:00Z', user_id: 'other' },
  { id: 3, title: 'Jam Tangan', description: 'Koleksi pribadi', start_bid: 300000, closed_at: '2099-01-01T00:00:00Z', user_id: 'u1' },
]
const routes = [
  { path: '/', component: HomePage },
  { path: '/aucations/:id', component: stubPage('Detail') },
]
const mount = (route = '/') =>
  renderWithProviders(HomePage, { route, routes, initialState: { users: { profile: { id: 'u1', name: 'Ani' } } } })

const cards = () => screen.getAllByTestId('aucation-card')
const dialog = (props) => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining(props))

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getAucations.mockResolvedValue({ data: { aucations: items } })
  })

  it('memuat semua lelang dan menampilkan kartu informatif', async () => {
    await mount()
    await screen.findByText('Kamera Analog')
    expect(api.getAucations).toHaveBeenCalledWith({})
    expect(cards()).toHaveLength(3)

    const [camera, bike] = cards()
    expect(within(camera).getByAltText('Cover Kamera Analog')).toHaveAttribute('src', 'https://img/1.png')
    expect(within(camera).getByText('Lensa 50mm')).toBeInTheDocument()
    expect(within(camera).getByText(/100\.000/)).toBeInTheDocument()
    expect(within(camera).getByText(/150\.000/)).toBeInTheDocument()
    expect(within(camera).getByText(/lagi$/)).toBeInTheDocument()
    expect(within(bike).queryByRole('img')).not.toBeInTheDocument()
    expect(within(bike).getByText('Ditutup')).toBeInTheDocument()
  })

  it('menampilkan empat tab dengan "Semua Lelang" terpilih', async () => {
    await mount()
    await screen.findByText('Kamera Analog')
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent.trim())).toEqual(['Semua Lelang', 'Lelang Saya', 'Lelang Berlangsung', 'Lelang Ditutup'])
    expect(screen.getByRole('tab', { name: 'Semua Lelang' })).toHaveAttribute('aria-selected', 'true')
  })

  it.each([
    ['Lelang Saya', { is_me: 1 }],
    ['Lelang Berlangsung', { is_closed: 0 }],
    ['Lelang Ditutup', { is_closed: 1 }],
  ])('tab "%s" memuat ulang dengan filter yang sesuai', async (label, filter) => {
    await mount()
    await screen.findByText('Kamera Analog')
    await userEvent.setup().click(screen.getByRole('tab', { name: label }))
    await waitFor(() => expect(api.getAucations).toHaveBeenLastCalledWith(filter))
    expect(screen.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true')
  })

  it('membaca tab awal dari query rute dan mengabaikan nilai tidak dikenal', async () => {
    const { unmount } = await mount('/?tab=closed')
    await waitFor(() => expect(api.getAucations).toHaveBeenCalledWith({ is_closed: 1 }))
    unmount()
    api.getAucations.mockClear()
    await mount('/?tab=ngawur')
    await waitFor(() => expect(api.getAucations).toHaveBeenCalledWith({}))
  })

  it('mengikuti perubahan query tab (mis. dari sidebar)', async () => {
    const { router } = await mount()
    await screen.findByText('Kamera Analog')
    await router.push('/?tab=mine')
    await waitFor(() => expect(api.getAucations).toHaveBeenLastCalledWith({ is_me: 1 }))
    expect(screen.getByRole('tab', { name: 'Lelang Saya' })).toHaveAttribute('aria-selected', 'true')
  })

  it('pencarian langsung pada judul dan deskripsi', async () => {
    await mount()
    await screen.findByText('Kamera Analog')
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Cari lelang'), 'bekas')
    expect(cards()).toHaveLength(1)
    expect(screen.getByText('Sepeda Lipat')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Cari lelang'))
    await user.type(screen.getByLabelText('Cari lelang'), 'tidak ada')
    expect(screen.getByText('Belum ada lelang di sini')).toBeInTheDocument()
  })

  it('menampilkan status memuat', async () => {
    const pending = deferred()
    api.getAucations.mockReturnValue(pending.promise)
    await mount()
    expect(screen.getByText('Memuat lelang…')).toBeInTheDocument()
    pending.resolve({ data: { aucations: [] } })
    expect(await screen.findByText('Belum ada lelang di sini')).toBeInTheDocument()
  })

  it('menampilkan dialog error saat gagal memuat', async () => {
    api.getAucations.mockRejectedValue(new Error('Jaringan putus'))
    await mount()
    await waitFor(() => dialog({ icon: 'error', title: 'Gagal memuat lelang', text: 'Jaringan putus' }))
  })

  it('tombol Tawar hanya untuk lelang berlangsung milik orang lain', async () => {
    await mount()
    await screen.findByText('Kamera Analog')
    const [camera, bike, watch] = cards()
    expect(within(camera).getByRole('button', { name: 'Tawar' })).toBeInTheDocument()
    expect(within(bike).queryByRole('button', { name: 'Tawar' })).not.toBeInTheDocument()
    expect(within(watch).queryByRole('button', { name: 'Tawar' })).not.toBeInTheDocument()
    expect(within(camera).getByRole('link', { name: 'Lihat detail' })).toHaveAttribute('href', '/aucations/1')
  })

  it('mengajukan tawaran dari kartu lalu memuat ulang daftar', async () => {
    api.postBid.mockResolvedValue({})
    await mount()
    await screen.findByText('Kamera Analog')
    const user = userEvent.setup()
    await user.click(within(cards()[0]).getByRole('button', { name: 'Tawar' }))
    await user.type(screen.getByLabelText('Nominal tawaranmu (Rp)'), '200000')
    await user.click(screen.getByRole('button', { name: 'Kirim tawaran' }))
    await waitFor(() => expect(api.postBid).toHaveBeenCalledWith(1, 200000))
    await waitFor(() => expect(api.getAucations).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('menutup modal tawaran tanpa mengirim', async () => {
    await mount()
    await screen.findByText('Kamera Analog')
    const user = userEvent.setup()
    await user.click(within(cards()[0]).getByRole('button', { name: 'Tawar' }))
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.postBid).not.toHaveBeenCalled()
  })

  it('menambah lelang baru dari modal lalu memuat ulang daftar', async () => {
    api.postAucation.mockResolvedValue({})
    await mount()
    await screen.findByText('Kamera Analog')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Tambah lelang' }))
    await user.type(screen.getByLabelText('Judul barang'), 'Radio Tua')
    typeInEditor('Radio tabung')
    await user.type(screen.getByLabelText('Harga awal (Rp)'), '75000')
    await fireEvent.update(screen.getByLabelText('Ditutup pada'), '2099-05-05T09:00')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tambah lelang' }))
    await waitFor(() => expect(api.postAucation).toHaveBeenCalled())
    await waitFor(() => expect(api.getAucations).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('menutup modal tambah lelang dengan Batal', async () => {
    await mount()
    await screen.findByText('Kamera Analog')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Tambah lelang' }))
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe('hapus semua lelang saya', () => {
    const openMine = async () => {
      await mount('/?tab=mine')
      await screen.findByText('Kamera Analog')
    }

    it('tombol hanya muncul di tab Lelang Saya saat ada data', async () => {
      await mount()
      await screen.findByText('Kamera Analog')
      expect(screen.queryByRole('button', { name: 'Hapus semua lelang saya' })).not.toBeInTheDocument()
      await userEvent.setup().click(screen.getByRole('tab', { name: 'Lelang Saya' }))
      expect(await screen.findByRole('button', { name: 'Hapus semua lelang saya' })).toBeInTheDocument()
      api.getAucations.mockResolvedValue({ data: { aucations: [] } })
      await userEvent.setup().type(screen.getByLabelText('Cari lelang'), 'zzz')
      expect(screen.queryByRole('button', { name: 'Hapus semua lelang saya' })).not.toBeInTheDocument()
    })

    it('menghapus setelah konfirmasi lalu memuat ulang', async () => {
      api.deleteAllAucations.mockResolvedValue({})
      await openMine()
      await userEvent.setup().click(screen.getByRole('button', { name: 'Hapus semua lelang saya' }))
      await waitFor(() => expect(api.deleteAllAucations).toHaveBeenCalled())
      await waitFor(() => dialog({ icon: 'success', text: 'Semua lelang milikmu sudah dihapus.' }))
      await waitFor(() => expect(api.getAucations).toHaveBeenCalledTimes(2))
    })

    it('tidak menghapus bila dibatalkan', async () => {
      Swal.fire.mockResolvedValueOnce({ isConfirmed: false })
      await openMine()
      await userEvent.setup().click(screen.getByRole('button', { name: 'Hapus semua lelang saya' }))
      await waitFor(() => expect(Swal.fire).toHaveBeenCalled())
      expect(api.deleteAllAucations).not.toHaveBeenCalled()
    })

    it('menampilkan dialog error saat gagal', async () => {
      api.deleteAllAucations.mockRejectedValue(new Error('Ditolak server'))
      await openMine()
      await userEvent.setup().click(screen.getByRole('button', { name: 'Hapus semua lelang saya' }))
      await waitFor(() => dialog({ icon: 'error', title: 'Gagal menghapus lelang', text: 'Ditolak server' }))
    })
  })
})
