import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/vue'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import MarkdownViewer from './MarkdownViewer.vue'

describe('MarkdownViewer', () => {
  beforeEach(() => {
    Viewer.instances.length = 0
  })

  it('merender konten markdown awal', () => {
    render(MarkdownViewer, { props: { content: '**tebal**' } })
    expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument()
    expect(Viewer.instances[0].value).toBe('**tebal**')
  })

  it('konten bawaan kosong', () => {
    render(MarkdownViewer)
    expect(Viewer.instances[0].value).toBe('')
  })

  it('memperbarui tampilan saat konten berubah', async () => {
    const { rerender } = render(MarkdownViewer, { props: { content: 'a' } })
    await rerender({ content: 'b' })
    expect(Viewer.instances[0].value).toBe('b')
  })

  it('menghancurkan viewer saat unmount', () => {
    const { unmount } = render(MarkdownViewer)
    unmount()
    expect(Viewer.instances[0].destroyed).toBe(true)
  })
})
