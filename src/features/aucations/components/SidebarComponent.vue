<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { LayoutDashboard, PackageOpen, UserRound, UsersRound, X } from 'lucide-vue-next'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const route = useRoute()

const links = [
  { label: 'Dashboard Lelang', to: '/', icon: LayoutDashboard, match: (r) => r.path === '/' && r.query.tab !== 'mine' },
  { label: 'Lelang Saya', to: { path: '/', query: { tab: 'mine' } }, icon: PackageOpen, match: (r) => r.path === '/' && r.query.tab === 'mine' },
  { label: 'Daftar Pengguna', to: '/users', icon: UsersRound, match: (r) => r.path === '/users' },
  { label: 'Profil Saya', to: '/profile', icon: UserRound, match: (r) => r.path === '/profile' },
]

const items = computed(() => links.map((link) => ({ ...link, active: link.match(route) })))
</script>

<template>
  <div>
    <button
      v-if="open"
      type="button"
      class="fixed inset-0 z-40 bg-ink/50 lg:hidden"
      aria-label="Tutup menu navigasi"
      data-testid="sidebar-backdrop"
      @click="emit('close')"
    />

    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-white pt-4 transition-transform lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:pt-6"
      :class="open ? 'translate-x-0' : '-translate-x-full'"
      aria-label="Navigasi utama"
      data-testid="sidebar"
    >
      <div class="flex items-center justify-between px-4 pb-3 lg:hidden">
        <span class="font-extrabold text-teal-deep">Menu</span>
        <button type="button" class="rounded-lg p-2 hover:bg-teal-wash" aria-label="Tutup menu" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <nav class="space-y-1 px-3">
        <RouterLink
          v-for="item in items"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="item.active ? 'bg-teal-deep text-white' : 'text-ink hover:bg-teal-wash'"
          :aria-current="item.active ? 'page' : undefined"
          @click="emit('close')"
        >
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
  </div>
</template>
