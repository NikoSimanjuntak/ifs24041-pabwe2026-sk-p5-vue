import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/vue'
import NotFoundPage from './NotFoundPage.vue'
import { renderWithProviders } from '@/test-utils'

describe('NotFoundPage', () => {
  it('menampilkan pesan 404 dan tautan kembali', async () => {
    await renderWithProviders(NotFoundPage)
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Halaman tidak ditemukan')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/')
  })
})
