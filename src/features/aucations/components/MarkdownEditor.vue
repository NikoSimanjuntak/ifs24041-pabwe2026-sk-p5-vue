<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  height: { type: String, default: '240px' },
})
const emit = defineEmits(['update:modelValue'])

const container = ref(null)
let editor

onMounted(() => {
  editor = new Editor({
    el: container.value,
    height: props.height,
    initialEditType: 'markdown',
    previewStyle: 'tab',
    hideModeSwitch: true,
    initialValue: props.modelValue,
    events: {
      change: () => emit('update:modelValue', editor.getMarkdown()),
    },
  })
})

watch(
  () => props.modelValue,
  (value) => {
    if (value !== editor.getMarkdown()) editor.setMarkdown(value)
  },
)

onBeforeUnmount(() => editor.destroy())
</script>

<template>
  <div ref="container" data-testid="markdown-editor" />
</template>
