<script setup>
import { ref, watch } from 'vue'
import { ImageUp, X } from 'lucide-vue-next'
import { useAucationsStore } from '../../states/aucationsStore'
import { showErrorDialog, showSuccessDialog } from '@/helpers/toolsHelper'

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
})
const emit = defineEmits(['close', 'saved'])

const store = useAucationsStore()
const file = ref(null)
const preview = ref('')
const error = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      file.value = null
      preview.value = props.aucation.cover || ''
      error.value = ''
    }
  },
  { immediate: true },
)

function onFileChange(event) {
  const [selected] = event.target.files
  if (!selected) return
  if (!selected.type.startsWith('image/')) {
    error.value = 'Berkas harus berupa gambar (JPG, PNG, atau WebP).'
    return
  }
  error.value = ''
  file.value = selected
  preview.value = URL.createObjectURL(selected)
}

async function onSubmit() {
  if (!file.value) {
    error.value = 'Pilih gambar cover terlebih dahulu.'
    return
  }
  const ok = await store.changeCover(props.aucation.id, file.value)
  if (ok) {
    showSuccessDialog('Cover lelang sudah diganti.')
    emit('saved')
    emit('close')
  } else {
    showErrorDialog(store.errorMessage, 'Gagal mengganti cover')
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-ink/60 p-4" role="dialog" aria-modal="true" aria-labelledby="cover-title">
    <form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" novalidate @submit.prevent="onSubmit">
      <div class="flex items-start justify-between">
        <h2 id="cover-title" class="text-xl font-extrabold">Ganti cover</h2>
        <button type="button" class="rounded-lg p-1.5 hover:bg-teal-wash" aria-label="Tutup" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <div class="mt-5 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-teal-wash">
        <img v-if="preview" :src="preview" alt="Pratinjau cover" class="h-full w-full object-cover" />
        <p v-else class="px-4 text-center text-sm text-ink-soft">Belum ada gambar. Pilih berkas untuk melihat pratinjau.</p>
      </div>

      <label class="btn btn-ghost mt-4 w-full cursor-pointer">
        <ImageUp :size="18" />
        Pilih gambar
        <input type="file" accept="image/*" class="sr-only" aria-label="Berkas cover" @change="onFileChange" />
      </label>
      <p v-if="error" class="mt-2 text-xs text-brick">{{ error }}</p>

      <div class="mt-6 flex justify-end gap-3">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" :disabled="store.isAucationChangeCover">
          {{ store.isAucationChangeCover ? 'Mengunggah…' : 'Simpan cover' }}
        </button>
      </div>
    </form>
  </div>
</template>
