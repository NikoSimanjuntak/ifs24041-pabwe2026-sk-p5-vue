<script setup>
import { RouterView } from 'vue-router'
import { Gavel } from 'lucide-vue-next'
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
    <aside
      class="relative hidden overflow-hidden bg-teal-deep p-12 text-white lg:flex lg:flex-col lg:justify-between"
      aria-label="Tentang Delcom Auction"
    >
      <div class="flex items-center gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brass text-ink">
          <Gavel :size="24" />
        </span>
        <span class="text-xl font-bold tracking-tight">Delcom Auction</span>
      </div>

      <div class="relative z-10 max-w-md">
        <p class="text-6xl font-extrabold leading-[1.05] tracking-tight">Tawar. Menang. Selesai.</p>
        <p class="mt-6 text-base leading-relaxed text-white/75">
          Pasang barang untuk dilelang, ikuti penawaran secara langsung, dan pantau siapa yang
          memimpin sampai palu diketuk.
        </p>
      </div>

      <svg
        class="pointer-events-none absolute -bottom-10 -right-10 h-96 w-96 text-white/10"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        stroke-width="6"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="90" />
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="30" />
      </svg>
      <p class="relative z-10 text-sm text-white/60">Praktikum PABWE 2026 · Studi Kasus 1</p>
    </aside>

    <main class="flex items-center justify-center px-5 py-12 sm:px-10">
      <div class="w-full max-w-md">
        <RouterView />
      </div>
    </main>
  </div>
</template>
