<script setup>
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useInput } from '@/hooks/useInput'
import { useAucationsStore } from '../../states/aucationsStore'
import { getHighestBid } from '../../utils'
import { formatRupiah, showErrorDialog, showSuccessDialog } from '@/helpers/toolsHelper'

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
})
const emit = defineEmits(['close', 'saved'])

const store = useAucationsStore()
const bid = useInput('')
const error = ref('')
const highest = computed(() => getHighestBid(props.aucation))

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      bid.reset()
      error.value = ''
    }
  },
  { immediate: true },
)

async function onSubmit() {
  const amount = Number(bid.value.value)
  if (!(amount > highest.value)) {
    error.value = `Tawaran harus lebih tinggi dari ${formatRupiah(highest.value)}.`
    return
  }
  error.value = ''
  const ok = await store.addBid(props.aucation.id, amount)
  if (ok) {
    showSuccessDialog('Tawaranmu sudah tercatat.')
    emit('saved')
    emit('close')
  } else {
    showErrorDialog(store.errorMessage, 'Gagal mengajukan tawaran')
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-ink/60 p-4" role="dialog" aria-modal="true" aria-labelledby="bid-title">
    <form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" novalidate @submit.prevent="onSubmit">
      <div class="flex items-start justify-between">
        <h2 id="bid-title" class="text-xl font-extrabold">Ajukan tawaran</h2>
        <button type="button" class="rounded-lg p-1.5 hover:bg-teal-wash" aria-label="Tutup" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <p class="mt-3 text-sm text-ink-soft">{{ aucation.title }}</p>
      <div class="mt-4 rounded-xl bg-brass-wash px-4 py-3">
        <p class="text-xs font-semibold text-brass-deep">Tawaran tertinggi saat ini</p>
        <p class="text-xl font-extrabold">{{ formatRupiah(highest) }}</p>
      </div>

      <div class="mt-5">
        <label for="bid-amount" class="mb-1.5 block text-sm font-semibold">Nominal tawaranmu (Rp)</label>
        <input id="bid-amount" type="number" min="0" class="field" :class="{ 'field-error': error }" :value="bid.value.value" @input="bid.onChange" />
        <p v-if="error" class="mt-1.5 text-xs text-brick">{{ error }}</p>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-brass" :disabled="store.isBidAdd">
          {{ store.isBidAdd ? 'Mengirim…' : 'Kirim tawaran' }}
        </button>
      </div>
    </form>
  </div>
</template>
