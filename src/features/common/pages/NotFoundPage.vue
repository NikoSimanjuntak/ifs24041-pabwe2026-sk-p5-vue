<script setup>
import { RouterLink } from 'vue-router'
import { SearchX } from 'lucide-vue-next'
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
    <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brass-wash text-brass-deep">
      <SearchX :size="32" />
    </div>
    <h1 class="text-5xl font-extrabold tracking-tight text-teal-deep">404</h1>
    <p class="mt-3 text-lg font-semibold">Halaman tidak ditemukan</p>
    <p class="mt-1 max-w-md text-sm text-ink-soft">
      Alamat yang kamu buka tidak ada atau sudah dipindahkan. Kembali ke daftar lelang untuk melanjutkan.
    </p>
    <RouterLink to="/" class="btn btn-primary mt-6">Kembali ke beranda</RouterLink>
  </main>
</template>
