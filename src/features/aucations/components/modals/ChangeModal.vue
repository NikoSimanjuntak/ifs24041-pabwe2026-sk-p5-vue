```vue
<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useInput } from '@/hooks/useInput'
import { useAucationsStore } from '../../states/aucationsStore'
import { validateAucationForm } from '../../utils'
import { showErrorDialog, showSuccessDialog, toDateTimeLocal } from '@/helpers/toolsHelper'
import MarkdownEditor from '../MarkdownEditor.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
})

const emit = defineEmits(['close', 'saved'])

const store = useAucationsStore()

const title = useInput('')
const startBid = useInput('')
const closedAt = useInput('')
const description = ref('')
const errors = ref({})

watch(
  () => [props.open, props.aucation],
  ([isOpen, aucation]) => {
    if (isOpen && aucation) {
      title.reset(aucation.title ?? '')
      startBid.reset(String(aucation.start_bid ?? ''))
      closedAt.reset(toDateTimeLocal(aucation.closed_at))
      description.value = aucation.description ?? ''
      errors.value = {}
    }
  },
  { immediate: true },
)

async function onSubmit() {
  const form = {
    title: title.value.value,
    description: description.value,
    start_bid: startBid.value.value,
    closed_at: closedAt.value.value,
  }

  errors.value = validateAucationForm(form)

  if (Object.keys(errors.value).length > 0) {
    return
  }

  const ok = await store.changeAucation(props.aucation.id, {
    ...form,
    title: form.title.trim(),
    description: form.description.trim(),
    start_bid: Number(form.start_bid),
    closed_at: new Date(form.closed_at).toISOString(),
  })

  if (ok) {
    showSuccessDialog('Data lelang sudah diperbarui.')
    emit('saved')
    emit('close')
  } else {
    showErrorDialog(
      store.errorMessage,
      'Gagal mengubah lelang',
    )
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8"
    role="dialog"
    aria-modal="true"
    aria-labelledby="change-title"
  >
    <form
      class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
      novalidate
      @submit.prevent="onSubmit"
    >
      <div class="flex items-start justify-between">
        <h2 id="change-title" class="text-xl font-extrabold">
          Ubah lelang
        </h2>

        <button
          type="button"
          class="rounded-lg p-1.5 hover:bg-teal-wash"
          aria-label="Tutup"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="mt-5 space-y-5">
        <div>
          <label
            for="change-title-input"
            class="mb-1.5 block text-sm font-semibold"
          >
            Judul barang
          </label>

          <input
            id="change-title-input"
            type="text"
            class="field"
            :class="{ 'field-error': errors.title }"
            :value="title.value.value"
            @input="title.onChange"
          />

          <p
            v-if="errors.title"
            class="mt-1.5 text-xs text-brick"
          >
            {{ errors.title }}
          </p>
        </div>

        <div>
          <label
            class="mb-1.5 block text-sm font-semibold"
          >
            Deskripsi
          </label>

          <MarkdownEditor v-model="description" />

          <p
            v-if="errors.description"
            class="mt-1.5 text-xs text-brick"
          >
            {{ errors.description }}
          </p>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              for="change-start-bid"
              class="mb-1.5 block text-sm font-semibold"
            >
              Harga awal (Rp)
            </label>

            <input
              id="change-start-bid"
              type="number"
              min="0"
              class="field"
              :class="{ 'field-error': errors.start_bid }"
              :value="startBid.value.value"
              @input="startBid.onChange"
            />

            <p
              v-if="errors.start_bid"
              class="mt-1.5 text-xs text-brick"
            >
              {{ errors.start_bid }}
            </p>
          </div>

          <div>
            <label
              for="change-closed-at"
              class="mb-1.5 block text-sm font-semibold"
            >
              Ditutup pada
            </label>

            <input
              id="change-closed-at"
              type="datetime-local"
              class="field"
              :class="{ 'field-error': errors.closed_at }"
              :value="closedAt.value.value"
              @input="closedAt.onChange"
            />

            <p
              v-if="errors.closed_at"
              class="mt-1.5 text-xs text-brick"
            >
              {{ errors.closed_at }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-7 flex justify-end gap-3">
        <button
          type="button"
          class="btn btn-ghost"
          @click="emit('close')"
        >
          Batal
        </button>

        <button
          type="submit"
          class="btn btn-primary"
          :disabled="store.isAucationChange"
        >
          {{
            store.isAucationChange
              ? 'Menyimpan…'
              : 'Simpan perubahan'
          }}
        </button>
      </div>
    </form>
  </div>
</template>
```