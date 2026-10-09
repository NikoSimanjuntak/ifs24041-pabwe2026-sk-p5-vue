<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import MarkdownEditor from '../MarkdownEditor.vue'
import { useInput } from '@/hooks/useInput'
import { useAucationsStore } from '../../states/aucationsStore'
import { validateAucationForm } from '../../utils'
import { showErrorDialog, showSuccessDialog } from '@/helpers/toolsHelper'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'saved'])

const store = useAucationsStore()
const title = useInput('')
const startBid = useInput('')
const closedAt = useInput('')
const description = ref('')
const errors = ref({})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      title.reset()
      startBid.reset()
      closedAt.reset()
      description.value = ''
      errors.value = {}
    }
  },
)

async function onSubmit() {
  const form = {
    title: title.value.value,
    description: description.value,
    start_bid: startBid.value.value,
    closed_at: closedAt.value.value,
  }
  errors.value = validateAucationForm(form)
  if (Object.keys(errors.value).length) return

  const ok = await store.addAucation({
    ...form,
    title: form.title.trim(),
    start_bid: Number(form.start_bid),
    closed_at: new Date(form.closed_at).toISOString(),
  })
  if (ok) {
    showSuccessDialog('Lelang baru sudah ditambahkan.')
    emit('saved')
    emit('close')
  } else {
    showErrorDialog(store.errorMessage, 'Gagal menambah lelang')
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="add-title">
    <form class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" novalidate @submit.prevent="onSubmit">
      <div class="flex items-start justify-between">
        <h2 id="add-title" class="text-xl font-extrabold">Tambah lelang</h2>
        <button type="button" class="rounded-lg p-1.5 hover:bg-teal-wash" aria-label="Tutup" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <div class="mt-5 space-y-5">
        <div>
          <label for="add-title-input" class="mb-1.5 block text-sm font-semibold">Judul barang</label>
          <input id="add-title-input" type="text" class="field" :class="{ 'field-error': errors.title }" placeholder="Contoh: Kamera analog tahun 1980" :value="title.value.value" @input="title.onChange" />
          <p v-if="errors.title" class="mt-1.5 text-xs text-brick">{{ errors.title }}</p>
        </div>

        <div>
          <span class="mb-1.5 block text-sm font-semibold">Deskripsi</span>
          <MarkdownEditor v-model="description" />
          <p v-if="errors.description" class="mt-1.5 text-xs text-brick">{{ errors.description }}</p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="add-start-bid" class="mb-1.5 block text-sm font-semibold">Harga awal (Rp)</label>
            <input id="add-start-bid" type="number" min="0" class="field" :class="{ 'field-error': errors.start_bid }" :value="startBid.value.value" @input="startBid.onChange" />
            <p v-if="errors.start_bid" class="mt-1.5 text-xs text-brick">{{ errors.start_bid }}</p>
          </div>
          <div>
            <label for="add-closed-at" class="mb-1.5 block text-sm font-semibold">Ditutup pada</label>
            <input id="add-closed-at" type="datetime-local" class="field" :class="{ 'field-error': errors.closed_at }" :value="closedAt.value.value" @input="closedAt.onChange" />
            <p v-if="errors.closed_at" class="mt-1.5 text-xs text-brick">{{ errors.closed_at }}</p>
          </div>
        </div>
      </div>

      <div class="mt-7 flex justify-end gap-3">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" :disabled="store.isAucationAdd">
          {{ store.isAucationAdd ? 'Menyimpan…' : 'Tambah lelang' }}
        </button>
      </div>
    </form>
  </div>
</template>
