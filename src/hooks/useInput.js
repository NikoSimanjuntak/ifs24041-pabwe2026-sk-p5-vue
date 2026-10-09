import { ref } from 'vue'

/**
 * Composable untuk two-way binding input form.
 * onChange menerima Event DOM maupun nilai mentah.
 */
export function useInput(initialValue = '') {
  const value = ref(initialValue)

  const onChange = (eventOrValue) => {
    value.value =
      eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue
  }

  const reset = (next = initialValue) => {
    value.value = next
  }

  return { value, onChange, reset }
}
