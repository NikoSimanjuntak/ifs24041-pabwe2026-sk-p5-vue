import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import SidebarComponent from './SidebarComponent.vue'
import { renderWithProviders } from '@/test-utils'

const labels = ['Dashboard Lelang', 'Lelang Saya', 'Daftar Pengguna', 'Profil Saya']

describe('SidebarComponent', () => {
  it('menampilkan empat menu navigasi', async () => {
    await renderWithProviders(SidebarComponent)
    labels.forEach((label) => expect(screen.getByRole('link', { name: label })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Dashboard Lelang' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Lelang Saya' })).toHaveAttribute('href', '/?tab=mine')
    expect(screen.getByRole('link', { name: 'Daftar Pengguna' })).toHaveAttribute('href', '/users')
    expect(screen.getByRole('link', { name: 'Profil Saya' })).toHaveAttribute('href', '/profile')
  })

  it.each([
    ['/', 'Dashboard Lelang'],
    ['/?tab=mine', 'Lelang Saya'],
    ['/users', 'Daftar Pengguna'],
    ['/profile', 'Profil Saya'],
  ])('menandai menu aktif untuk rute %s', async (route, active) => {
    await renderWithProviders(SidebarComponent, { route })
    labels.forEach((label) => {
      const link = screen.getByRole('link', { name: label })
      if (label === active) expect(link).toHaveAttribute('aria-current', 'page')
      else expect(link).not.toHaveAttribute('aria-current')
    })
  })

  it('drawer tertutup: tanpa backdrop dan tergeser keluar layar', async () => {
    await renderWithProviders(SidebarComponent, { props: { open: false } })
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toHaveClass('-translate-x-full')
  })

  it('drawer terbuka: backdrop tampil dan dapat ditutup', async () => {
    const { emitted } = await renderWithProviders(SidebarComponent, { props: { open: true } })
    const user = userEvent.setup()
    expect(screen.getByTestId('sidebar')).toHaveClass('translate-x-0')
    await user.click(screen.getByTestId('sidebar-backdrop'))
    await user.click(screen.getByRole('button', { name: 'Tutup menu' }))
    expect(emitted().close).toHaveLength(2)
  })

  it('menutup drawer saat memilih menu', async () => {
    const { emitted } = await renderWithProviders(SidebarComponent, { props: { open: true } })
    await userEvent.setup().click(screen.getByRole('link', { name: 'Profil Saya' }))
    expect(emitted().close).toHaveLength(1)
  })

  it('prop open bernilai false secara default', async () => {
    await renderWithProviders(SidebarComponent)
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })
})
