import { render, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import Editor from '@toast-ui/editor'

const blank = { template: '<div />' }

/** Pinia baru (aktif) dengan state awal opsional: { storeId: { key: value } } */
export function createMockPinia(initialState = {}) {
  const pinia = createPinia()
  pinia.state.value = JSON.parse(JSON.stringify(initialState))
  setActivePinia(pinia)
  return pinia
}

/** Router berbasis memory history untuk pengujian komponen. */
export function createTestRouter(routes = [{ path: '/:pathMatch(.*)*', component: blank }]) {
  return createRouter({ history: createMemoryHistory(), routes })
}

/**
 * Render komponen Vue lengkap dengan Pinia dan router memory.
 * options: { route, routes, props, slots, initialState, pinia, router, guard }
 */
export async function renderWithProviders(component, options = {}) {
  const {
    route = '/',
    routes,
    props,
    slots,
    initialState,
    pinia = createMockPinia(initialState),
    router = createTestRouter(routes),
    guard,
  } = options
  if (guard) router.beforeEach(guard)
  router.push(route)
  await router.isReady()
  const utils = render(component, {
    props,
    slots,
    global: { plugins: [pinia, router] },
  })
  return { ...utils, router, pinia }
}

/** Mengisi editor markdown palsu (modal tambah/ubah) seolah pengguna mengetik. */
export async function typeInEditor(text) {
  // editor dimuat secara lazy (async component), jadi tunggu sampai terpasang
  await waitFor(() => {
    if (!Editor.instances.length) throw new Error('Editor belum terpasang')
  })
  const editor = Editor.instances.at(-1)
  editor.value = text
  editor.options.events.change()
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

/** Promise yang diselesaikan manual — untuk menguji state "sedang memuat". */
export function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

export const stubPage = (text) => ({ template: `<p>${text}</p>` })