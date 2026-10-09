import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/vue'

// SweetAlert2 dimock agar tidak membuka dialog sungguhan saat pengujian.
vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: true })) },
}))

// @toast-ui/editor membutuhkan layout browser penuh, jadi diganti editor palsu.
vi.mock('@toast-ui/editor', () => {
  class Editor {
    static instances = []
    constructor(options) {
      this.options = options
      this.value = options.initialValue ?? ''
      this.destroyed = false
      Editor.instances.push(this)
    }
    getMarkdown() {
      return this.value
    }
    setMarkdown(value) {
      this.value = value
    }
    destroy() {
      this.destroyed = true
    }
  }
  return { default: Editor }
})

vi.mock('@toast-ui/editor/dist/toastui-editor-viewer', () => {
  class Viewer {
    static instances = []
    constructor(options) {
      this.options = options
      this.value = options.initialValue ?? ''
      this.destroyed = false
      Viewer.instances.push(this)
    }
    setMarkdown(value) {
      this.value = value
    }
    destroy() {
      this.destroyed = true
    }
  }
  return { default: Viewer }
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
  vi.useRealTimers()
})
