import { describe, expect, it, vi } from 'vitest'
import * as api from './aucationApi'
import { apiDelete, apiGet, apiPost, apiPut, apiRequest } from '@/helpers/apiHelper'

vi.mock('@/helpers/apiHelper', () => ({
  apiGet: vi.fn(() => Promise.resolve({})),
  apiPost: vi.fn(() => Promise.resolve({})),
  apiPut: vi.fn(() => Promise.resolve({})),
  apiDelete: vi.fn(() => Promise.resolve({})),
  apiRequest: vi.fn(() => Promise.resolve({})),
}))

const form = { title: 'T', description: 'D', start_bid: 100, closed_at: '2026-12-01T00:00:00Z' }

describe('aucationApi', () => {
  it('getAucations mengirim filter is_me / is_closed', async () => {
    await api.getAucations({ is_me: 1, is_closed: 0 })
    expect(apiGet).toHaveBeenCalledWith('/aucations', { is_me: 1, is_closed: 0 })
    await api.getAucations()
    expect(apiGet).toHaveBeenLastCalledWith('/aucations', {})
  })

  it('getAucation memanggil GET /aucations/:id', async () => {
    await api.getAucation(7)
    expect(apiGet).toHaveBeenCalledWith('/aucations/7')
  })

  it('postAucation memanggil POST /aucations dengan 4 field', async () => {
    await api.postAucation({ ...form, extra: 1 })
    expect(apiPost).toHaveBeenCalledWith('/aucations', form)
  })

  it('putAucation memanggil PUT /aucations/:id', async () => {
    await api.putAucation(7, { ...form, extra: 1 })
    expect(apiPut).toHaveBeenCalledWith('/aucations/7', form)
  })

  it('postCover mengirim FormData berisi field cover', async () => {
    const file = new File(['x'], 'c.png', { type: 'image/png' })
    await api.postCover(7, file)
    const [path, options] = apiRequest.mock.calls[0]
    expect(path).toBe('/aucations/7/cover')
    expect(options.method).toBe('POST')
    expect(options.body.get('cover')).toBe(file)
  })

  it('deleteAucation memanggil DELETE /aucations/:id', async () => {
    await api.deleteAucation(7)
    expect(apiDelete).toHaveBeenCalledWith('/aucations/7')
  })

  it('postBid memanggil POST /aucations/:id/bids', async () => {
    await api.postBid(7, 500)
    expect(apiPost).toHaveBeenCalledWith('/aucations/7/bids', { bid: 500 })
  })

  it('deleteBid memanggil DELETE /aucations/:id/bids', async () => {
    await api.deleteBid(7)
    expect(apiDelete).toHaveBeenCalledWith('/aucations/7/bids')
  })

  it('deleteAllAucations memanggil DELETE /aucations', async () => {
    await api.deleteAllAucations()
    expect(apiDelete).toHaveBeenCalledWith('/aucations')
  })
})
