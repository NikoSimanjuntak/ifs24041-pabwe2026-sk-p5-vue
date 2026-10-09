import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAucationsStore } from './aucationsStore'
import * as api from '../api/aucationApi'

vi.mock('../api/aucationApi')

describe('aucationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetchAucations mengisi koleksi', async () => {
    api.getAucations.mockResolvedValue({ data: { aucations: [{ id: 1 }] } })
    const store = useAucationsStore()
    const promise = store.fetchAucations({ is_me: 1 })
    expect(store.isAucation).toBe(true)
    expect(await promise).toBe(true)
    expect(store.aucations).toEqual([{ id: 1 }])
    expect(store.isAucation).toBe(false)
    expect(api.getAucations).toHaveBeenCalledWith({ is_me: 1 })
    await store.fetchAucations()
    expect(api.getAucations).toHaveBeenLastCalledWith({})
  })

  it('fetchAucations menyimpan error', async () => {
    api.getAucations.mockRejectedValue(new Error('Down'))
    const store = useAucationsStore()
    expect(await store.fetchAucations()).toBe(false)
    expect(store.errorMessage).toBe('Down')
  })

  it('fetchAucation mengisi lelang aktif', async () => {
    api.getAucation.mockResolvedValue({ data: { aucation: { id: 3 } } })
    const store = useAucationsStore()
    expect(await store.fetchAucation(3)).toBe(true)
    expect(store.aucation).toEqual({ id: 3 })
  })

  it('fetchAucation mengosongkan lelang saat gagal', async () => {
    api.getAucation.mockRejectedValue(new Error('Tidak ada'))
    const store = useAucationsStore()
    store.aucation = { id: 1 }
    expect(await store.fetchAucation(9)).toBe(false)
    expect(store.aucation).toBeNull()
    expect(store.errorMessage).toBe('Tidak ada')
  })

  const mutations = [
    ['addAucation', 'postAucation', 'isAucationAdd', 'isAucationAdded', [{ title: 'x' }], [{ title: 'x' }]],
    ['changeAucation', 'putAucation', 'isAucationChange', 'isAucationChanged', [1, { title: 'x' }], [1, { title: 'x' }]],
    ['changeCover', 'postCover', 'isAucationChangeCover', 'isAucationChangedCover', [1, 'file'], [1, 'file']],
    ['deleteAucation', 'deleteAucation', 'isAucationDelete', 'isAucationDeleted', [1], [1]],
    ['addBid', 'postBid', 'isBidAdd', 'isBidAdded', [1, 500], [1, 500]],
    ['deleteBid', 'deleteBid', 'isBidDelete', 'isBidDeleted', [1], [1]],
    ['deleteAllAucations', 'deleteAllAucations', 'isAucationDeleteAll', 'isAucationDeletedAll', [], []],
  ]

  describe.each(mutations)('%s', (action, apiFn, loadingFlag, doneFlag, args, apiArgs) => {
    it('berhasil: flag proses menyala lalu flag hasil true', async () => {
      api[apiFn].mockResolvedValue({})
      const store = useAucationsStore()
      const promise = store[action](...args)
      expect(store[loadingFlag]).toBe(true)
      expect(await promise).toBe(true)
      expect(store[loadingFlag]).toBe(false)
      expect(store[doneFlag]).toBe(true)
      expect(api[apiFn]).toHaveBeenCalledWith(...apiArgs)
    })

    it('gagal: menyimpan pesan error', async () => {
      api[apiFn].mockRejectedValue(new Error('Gagal total'))
      const store = useAucationsStore()
      expect(await store[action](...args)).toBe(false)
      expect(store[doneFlag]).toBe(false)
      expect(store[loadingFlag]).toBe(false)
      expect(store.errorMessage).toBe('Gagal total')
    })
  })

  it('resetStatus membersihkan semua flag hasil', async () => {
    api.postBid.mockResolvedValue({})
    const store = useAucationsStore()
    await store.addBid(1, 5)
    store.errorMessage = 'x'
    store.resetStatus()
    expect(store.isBidAdded).toBe(false)
    expect(store.errorMessage).toBe('')
  })
})
