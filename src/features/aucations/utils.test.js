import { describe, expect, it } from 'vitest'
import {
  getBidderName,
  getBids,
  getCountdown,
  getHighestBid,
  isClosed,
  isOwnedBy,
  matchesSearch,
  plainText,
  validateAucationForm,
} from './utils'

const NOW = new Date('2026-10-08T00:00:00Z').getTime()
const at = (ms) => new Date(NOW + ms).toISOString()

describe('aucation utils', () => {
  it('getBids selalu mengembalikan array', () => {
    expect(getBids({ bids: [{ bid: 1 }] })).toHaveLength(1)
    expect(getBids({ bids: null })).toEqual([])
    expect(getBids(undefined)).toEqual([])
  })

  it('getHighestBid memilih nilai terbesar dari harga awal dan bid', () => {
    expect(getHighestBid({ start_bid: 100, bids: [{ bid: 300 }, { bid: '200' }] })).toBe(300)
    expect(getHighestBid({ start_bid: 500, bids: [{ bid: 300 }] })).toBe(500)
    expect(getHighestBid({ start_bid: 'x', bids: [{ bid: 'y' }] })).toBe(0)
    expect(getHighestBid(null)).toBe(0)
  })

  it('isClosed membaca flag maupun waktu penutupan', () => {
    expect(isClosed({ is_closed: true })).toBe(true)
    expect(isClosed({ is_closed: 1 })).toBe(true)
    expect(isClosed({ closed_at: at(-1000) }, NOW)).toBe(true)
    expect(isClosed({ closed_at: at(1000) }, NOW)).toBe(false)
    expect(isClosed({ closed_at: 'xx' }, NOW)).toBe(false)
    expect(isClosed(undefined, NOW)).toBe(false)
    expect(isClosed({ closed_at: '2000-01-01T00:00:00Z' })).toBe(true)
  })

  it('getCountdown menghasilkan teks sisa waktu', () => {
    expect(getCountdown({ closed_at: at(-1) }, NOW)).toBe('Ditutup')
    expect(getCountdown({ closed_at: 'xx' }, NOW)).toBe('Tanpa batas waktu')
    expect(getCountdown({ closed_at: at(5 * 1000) }, NOW)).toBe('1m lagi')
    expect(getCountdown({ closed_at: at(45 * 60000) }, NOW)).toBe('45m lagi')
    expect(getCountdown({ closed_at: at(125 * 60000) }, NOW)).toBe('2j 5m lagi')
    expect(getCountdown({ closed_at: at((2 * 1440 + 3 * 60) * 60000) }, NOW)).toBe('2h 3j lagi')
    expect(getCountdown({ closed_at: at(3600000 * 48) })).toMatch(/lagi|Ditutup/)
  })

  it('matchesSearch mencari pada judul dan deskripsi', () => {
    const item = { title: 'Kamera Analog', description: 'Lensa 50mm' }
    expect(matchesSearch(item, '')).toBe(true)
    expect(matchesSearch(item, undefined)).toBe(true)
    expect(matchesSearch(item, 'kamera')).toBe(true)
    expect(matchesSearch(item, ' LENSA ')).toBe(true)
    expect(matchesSearch(item, 'sepatu')).toBe(false)
    expect(matchesSearch({}, 'a')).toBe(false)
  })

  it('getBidderName memilih nama yang tersedia', () => {
    expect(getBidderName({ user: { name: 'Ani' } })).toBe('Ani')
    expect(getBidderName({ user_name: 'Budi' })).toBe('Budi')
    expect(getBidderName({})).toBe('Peserta')
    expect(getBidderName(undefined)).toBe('Peserta')
  })

  it('isOwnedBy membandingkan pemilik lelang', () => {
    expect(isOwnedBy({ user_id: 'u1' }, 'u1')).toBe(true)
    expect(isOwnedBy({ user: { id: 'u1' } }, 'u1')).toBe(true)
    expect(isOwnedBy({ user_id: 'u2' }, 'u1')).toBe(false)
    expect(isOwnedBy({ user_id: 'u1' }, undefined)).toBe(false)
    expect(isOwnedBy({ user_id: 'u1' }, null)).toBe(false)
    expect(isOwnedBy(undefined, 'u1')).toBe(false)
  })

  it('plainText membuang simbol markdown', () => {
    expect(plainText('# Judul\n\n**tebal** dan `kode`')).toBe('Judul tebal dan kode')
    expect(plainText(undefined)).toBe('')
  })

  describe('validateAucationForm', () => {
    const valid = { title: 'A', description: 'B', start_bid: 100, closed_at: at(60000) }

    it('lolos bila semua valid', () => {
      expect(validateAucationForm(valid, NOW)).toEqual({})
    })

    it('mendeteksi semua kesalahan', () => {
      const errors = validateAucationForm({ title: ' ', description: '', start_bid: 0, closed_at: '' }, NOW)
      expect(Object.keys(errors).sort()).toEqual(['closed_at', 'description', 'start_bid', 'title'])
      expect(errors.closed_at).toMatch(/wajib/)
    })

    it('menangani nilai undefined dan tanggal tidak valid', () => {
      expect(Object.keys(validateAucationForm({}, NOW))).toHaveLength(4)
      expect(validateAucationForm({ ...valid, closed_at: 'xx' }, NOW).closed_at).toMatch(/wajib/)
    })

    it('menolak batas waktu di masa lalu', () => {
      expect(validateAucationForm({ ...valid, closed_at: at(-1000) }, NOW).closed_at).toMatch(/masa depan/)
    })

    it('memakai waktu sekarang sebagai default', () => {
      expect(validateAucationForm({ ...valid, closed_at: '2000-01-01T00:00' }).closed_at).toMatch(/masa depan/)
    })
  })
})
