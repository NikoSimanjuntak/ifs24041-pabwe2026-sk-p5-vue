import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/vue'
import App from '@/App.vue'
import AuthLayout from './AuthLayout.vue'
import { renderWithProviders, stubPage } from '@/test-utils'

describe('AuthLayout', () => {
  it('menampilkan banner dan konten rute anak', async () => {
    await renderWithProviders(App, {
      route: '/auth/login',
      routes: [{ path: '/auth', component: AuthLayout, children: [{ path: 'login', component: stubPage('Konten login') }] }],
    })
    expect(screen.getByLabelText('Tentang Delcom Auction')).toBeInTheDocument()
    expect(screen.getByText('Tawar. Menang. Selesai.')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByText('Konten login')).toBeInTheDocument()
  })
})
