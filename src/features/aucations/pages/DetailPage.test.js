import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import DetailPage from './DetailPage.vue'
import * as api from '../api/aucationApi'
import { deferred, renderWithProviders, stubPage } from '@/test-utils'

vi.mock('../api/aucationApi')

const base = {
  id: 5,
  title: 'Kamera Analog',
  description: '## Spesifikasi\nLensa 50mm',
  start_bid: 100000,
  cover: 'https://img/5.png',
  closed_at: '2099-01-01T00:00:00Z',
  user_id: 'owner',
  bids: [
    { id: 'b1', bid: 150000, user_id: 'u9', user: { name: 'Budi' }, created_at: '2026-10-01T10:00:00Z' },
    { id: 'b2', bid: 300000, user_id: 'u1', user: { name: 'Ani' }, created_at: '2026-10-02T10:00:00Z' },
    { id: 'b3', bid: 200000, user_id: 'u8' },
  ],
}
const routes = [
  { path: '/', component: stubPage('Beranda') },
  { path: '/aucations/:aucationId', component: DetailPage },
]
const mount = (aucation = base, profile = { id: 'u1', name: 'Ani' }) => {
  api.getAucation.mockResolvedValue({ data: { aucation } })
  return renderWithProviders(DetailPage, {
    route: '/aucations/5',
    routes,
    initialState: profile ? { users: { profile } } : undefined,
  })
}
const dialog = (props) => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining(props))
const asOwner = () => mount(base, { id: 'owner' })

describe('DetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Viewer.instances.length = 0
  })

  it('memuat lelang berdasarkan parameter rute dan menampilkan detail', async () => {
    await mount()
    expect(await screen.findByRole('heading', { name: 'Kamera Analog' })).toBeInTheDocument()
    expect(api.getAucation).toHaveBeenCalledWith('5')
    expect(screen.getByAltText('Cover Kamera Analog')).toHaveAttribute('src', 'https://img/5.png')
    expect(Viewer.instances.at(-1).value).toBe('## Spesifikasi\nLensa 50mm')
    expect(screen.getByText(/Harga awal/)).toHaveTextContent(/100\.000/)
  })

  it('menampilkan tawaran tertinggi dan riwayat bid terurut dari terbesar', async () => {
    await mount()
    await screen.findByRole('heading', { name: 'Kamera Analog' })
    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('Ani')
    expect(rows[0]).toHaveTextContent(/300\.000/)
    expect(rows[1]).toHaveTextContent('Peserta')
    expect(rows[2]).toHaveTextContent('Budi')
    expect(screen.getAllByText(/300\.000/).length).toBeGreaterThan(1)
  })

  it('tanpa cover dan tanpa bid menampilkan placeholder', async () => {
    await mount({ ...base, cover: undefined, bids: undefined })
    await screen.findByRole('heading', { name: 'Kamera Analog' })
    expect(screen.queryByAltText('Cover Kamera Analog')).not.toBeInTheDocument()
    expect(screen.getByText(/Belum ada penawaran/)).toBeInTheDocument()
  })

  it('menampilkan status memuat', async () => {
    const pending = deferred()
    api.getAucation.mockReturnValue(pending.promise)
    await renderWithProviders(DetailPage, { route: '/aucations/5', routes })
    expect(screen.getByText('Memuat detail lelang…')).toBeInTheDocument()
    pending.resolve({ data: { aucation: base } })
    expect(await screen.findByRole('heading', { name: 'Kamera Analog' })).toBeInTheDocument()
  })

  it('menampilkan keadaan tidak ditemukan dan dialog error', async () => {
    api.getAucation.mockRejectedValue(new Error('Lelang tidak ada'))
    await renderWithProviders(DetailPage, { route: '/aucations/5', routes })
    expect(await screen.findByText('Lelang tidak ditemukan')).toBeInTheDocument()
    await waitFor(() => dialog({ icon: 'error', title: 'Gagal memuat detail lelang', text: 'Lelang tidak ada' }))
    expect(screen.getByRole('link', { name: /Kembali ke daftar lelang/ })).toHaveAttribute('href', '/')
  })

  it('memuat ulang saat parameter rute berubah', async () => {
    const { router } = await mount()
    await screen.findByRole('heading', { name: 'Kamera Analog' })
    await router.push('/aucations/6')
    await waitFor(() => expect(api.getAucation).toHaveBeenLastCalledWith('6'))
  })

  describe('sebagai peserta', () => {
    it('dapat mengajukan tawaran, tanpa aksi pemilik', async () => {
      await mount(base, { id: 'u7' })
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      expect(screen.getByRole('button', { name: 'Ajukan tawaran' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Batalkan tawaranku' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Ubah lelang' })).not.toBeInTheDocument()
    })

    it('profil belum termuat diperlakukan sebagai peserta', async () => {
      await mount(base, null)
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      expect(screen.getByRole('button', { name: 'Ajukan tawaran' })).toBeInTheDocument()
    })

    it('tidak ada tombol bid pada lelang yang sudah ditutup', async () => {
      await mount({ ...base, closed_at: '2000-01-01T00:00:00Z' })
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      expect(screen.queryByRole('button', { name: 'Ajukan tawaran' })).not.toBeInTheDocument()
      expect(screen.getAllByText('Ditutup').length).toBeGreaterThan(0)
    })

    it('mengajukan tawaran lalu memuat ulang detail', async () => {
      api.postBid.mockResolvedValue({})
      await mount(base, { id: 'u7' })
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Ajukan tawaran' }))
      await user.type(screen.getByLabelText('Nominal tawaranmu (Rp)'), '400000')
      await user.click(screen.getByRole('button', { name: 'Kirim tawaran' }))
      await waitFor(() => expect(api.postBid).toHaveBeenCalledWith(5, 400000))
      await waitFor(() => expect(api.getAucation).toHaveBeenCalledTimes(2))
    })

    it('membatalkan tawaran sendiri setelah konfirmasi', async () => {
      api.deleteBid.mockResolvedValue({})
      await mount()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      await userEvent.setup().click(screen.getByRole('button', { name: 'Batalkan tawaranku' }))
      await waitFor(() => expect(api.deleteBid).toHaveBeenCalledWith(5))
      await waitFor(() => dialog({ icon: 'success', text: 'Tawaranmu sudah dibatalkan.' }))
      await waitFor(() => expect(api.getAucation).toHaveBeenCalledTimes(2))
    })

    it('tidak membatalkan tawaran bila konfirmasi ditolak', async () => {
      Swal.fire.mockResolvedValueOnce({ isConfirmed: false })
      await mount()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      await userEvent.setup().click(screen.getByRole('button', { name: 'Batalkan tawaranku' }))
      await waitFor(() => expect(Swal.fire).toHaveBeenCalled())
      expect(api.deleteBid).not.toHaveBeenCalled()
    })

    it('menampilkan error saat pembatalan tawaran gagal', async () => {
      api.deleteBid.mockRejectedValue(new Error('Tidak bisa'))
      await mount()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      await userEvent.setup().click(screen.getByRole('button', { name: 'Batalkan tawaranku' }))
      await waitFor(() => dialog({ icon: 'error', title: 'Gagal membatalkan tawaran', text: 'Tidak bisa' }))
    })
  })

  describe('sebagai pemilik', () => {
    it('melihat aksi pemilik dan tidak bisa menawar', async () => {
      await asOwner()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      expect(screen.getByRole('button', { name: 'Ubah lelang' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Ganti cover' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Hapus lelang' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Ajukan tawaran' })).not.toBeInTheDocument()
    })

    it('mengubah lelang lalu memuat ulang detail', async () => {
      api.putAucation.mockResolvedValue({})
      await asOwner()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Ubah lelang' }))
      await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }))
      await waitFor(() => expect(api.putAucation).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Kamera Analog' })))
      await waitFor(() => expect(api.getAucation).toHaveBeenCalledTimes(2))
    })

    it('mengganti cover lalu memuat ulang detail', async () => {
      URL.createObjectURL = vi.fn(() => 'blob:x')
      api.postCover.mockResolvedValue({})
      await asOwner()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Ganti cover' }))
      await user.upload(screen.getByLabelText('Berkas cover'), new File(['x'], 'c.png', { type: 'image/png' }))
      await user.click(screen.getByRole('button', { name: 'Simpan cover' }))
      await waitFor(() => expect(api.postCover).toHaveBeenCalledWith(5, expect.any(File)))
      await waitFor(() => expect(api.getAucation).toHaveBeenCalledTimes(2))
    })

    it('menghapus lelang setelah konfirmasi dan kembali ke beranda', async () => {
      api.deleteAucation.mockResolvedValue({})
      const { router } = await asOwner()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      await userEvent.setup().click(screen.getByRole('button', { name: 'Hapus lelang' }))
      await waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
      expect(api.deleteAucation).toHaveBeenCalledWith(5)
      dialog({ icon: 'success', text: 'Lelang sudah dihapus.' })
    })

    it('tidak menghapus bila konfirmasi ditolak', async () => {
      Swal.fire.mockResolvedValueOnce({ isConfirmed: false })
      const { router } = await asOwner()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      await userEvent.setup().click(screen.getByRole('button', { name: 'Hapus lelang' }))
      await waitFor(() => expect(Swal.fire).toHaveBeenCalled())
      expect(api.deleteAucation).not.toHaveBeenCalled()
      expect(router.currentRoute.value.path).toBe('/aucations/5')
    })

    it('menampilkan error saat penghapusan gagal', async () => {
      api.deleteAucation.mockRejectedValue(new Error('Sudah ada penawar'))
      const { router } = await asOwner()
      await screen.findByRole('heading', { name: 'Kamera Analog' })
      await userEvent.setup().click(screen.getByRole('button', { name: 'Hapus lelang' }))
      await waitFor(() => dialog({ icon: 'error', title: 'Gagal menghapus lelang', text: 'Sudah ada penawar' }))
      expect(router.currentRoute.value.path).toBe('/aucations/5')
    })
  })
})
