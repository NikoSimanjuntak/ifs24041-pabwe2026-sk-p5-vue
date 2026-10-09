<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

const props = defineProps({ content: { type: String, default: '' } })

const container = ref(null)
let viewer

onMounted(() => {
  viewer = new Viewer({ el: container.value, initialValue: props.content })
})

watch(
  () => props.content,
  (value) => viewer.setMarkdown(value),
)

onBeforeUnmount(() => viewer.destroy())
</script>

<template>
  <div ref="container" data-testid="markdown-viewer" />
</template>
