import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/vue'
import Editor from '@toast-ui/editor'
import MarkdownEditor from './MarkdownEditor.vue'

describe('MarkdownEditor', () => {
  beforeEach(() => {
    Editor.instances.length = 0
  })

  it('membuat editor dengan nilai awal dan tinggi bawaan', () => {
    render(MarkdownEditor, { props: { modelValue: '# Halo' } })
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
    const [editor] = Editor.instances
    expect(editor.getMarkdown()).toBe('# Halo')
    expect(editor.options.height).toBe('240px')
  })

  it('memakai nilai awal kosong dan tinggi kustom', () => {
    render(MarkdownEditor, { props: { height: '100px' } })
    expect(Editor.instances[0].getMarkdown()).toBe('')
    expect(Editor.instances[0].options.height).toBe('100px')
  })

  it('mengirim update:modelValue saat isi berubah', () => {
    const { emitted } = render(MarkdownEditor)
    const editor = Editor.instances[0]
    editor.value = 'teks baru'
    editor.options.events.change()
    expect(emitted()['update:modelValue'][0]).toEqual(['teks baru'])
  })

  it('menyinkronkan perubahan dari luar, tanpa setMarkdown berulang', async () => {
    const { rerender } = render(MarkdownEditor, { props: { modelValue: 'a' } })
    const editor = Editor.instances[0]
    await rerender({ modelValue: 'b' })
    expect(editor.getMarkdown()).toBe('b')
    // nilai sama dengan isi editor (mis. balasan dari event change) -> tidak diatur ulang
    editor.value = 'c'
    await rerender({ modelValue: 'c' })
    expect(editor.getMarkdown()).toBe('c')
  })

  it('menghancurkan editor saat unmount', () => {
    const { unmount } = render(MarkdownEditor)
    unmount()
    expect(Editor.instances[0].destroyed).toBe(true)
  })
})
