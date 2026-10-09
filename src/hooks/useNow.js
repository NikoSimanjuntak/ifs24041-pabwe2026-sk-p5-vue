import { onBeforeUnmount, ref } from 'vue'

/** Waktu reaktif yang diperbarui berkala (untuk countdown lelang). */
export function useNow(intervalMs = 30000) {
  const now = ref(Date.now())
  const timer = setInterval(() => {
    now.value = Date.now()
  }, intervalMs)
  onBeforeUnmount(() => clearInterval(timer))
  return now
}
