import { describe, expect, it, vi } from 'vitest'
import Swal from 'sweetalert2'
import {
  formatDate,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
  toDateTimeLocal,
} from './toolsHelper'

describe('toolsHelper', () => {
  it('showSuccessDialog menampilkan dialog sukses', async () => {
    await showSuccessDialog('Tersimpan')
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'success', title: 'Berhasil', text: 'Tersimpan' }),
    )
    await showSuccessDialog('Halo', 'Judul')
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Judul' }))
  })

  it('showErrorDialog menampilkan dialog error', async () => {
    await showErrorDialog('Rusak')
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'error', title: 'Terjadi kesalahan', text: 'Rusak' }),
    )
    await showErrorDialog('Rusak', 'Judul')
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Judul' }))
  })

  it('showConfirmDialog mengembalikan true saat dikonfirmasi', async () => {
    expect(await showConfirmDialog('Hapus?')).toBe(true)
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'warning', showCancelButton: true, title: 'Apakah kamu yakin?' }),
    )
    expect(await showConfirmDialog('Hapus?', 'Judul')).toBe(true)
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Judul' }))
  })

  it('showConfirmDialog mengembalikan false saat dibatalkan', async () => {
    Swal.fire.mockResolvedValueOnce({ isConfirmed: false })
    expect(await showConfirmDialog('Hapus?')).toBe(false)
  })

  it('formatRupiah memformat mata uang tanpa desimal', () => {
    expect(formatRupiah(1500000).replace(/\s/g, ' ')).toBe('Rp 1.500.000')
    expect(formatRupiah('abc').replace(/\s/g, ' ')).toBe('Rp 0')
    expect(formatRupiah(undefined).replace(/\s/g, ' ')).toBe('Rp 0')
  })

  it('formatDate memformat tanggal dan menangani nilai tidak valid', () => {
    expect(formatDate('2026-10-08T10:30:00')).toMatch(/2026/)
    expect(formatDate('')).toBe('-')
    expect(formatDate('bukan tanggal')).toBe('-')
  })

  it('toDateTimeLocal mengubah tanggal ke format datetime-local', () => {
    expect(toDateTimeLocal(new Date(2026, 9, 8, 9, 5).toISOString())).toBe('2026-10-08T09:05')
    expect(toDateTimeLocal('')).toBe('')
    expect(toDateTimeLocal('xx')).toBe('')
  })
})
