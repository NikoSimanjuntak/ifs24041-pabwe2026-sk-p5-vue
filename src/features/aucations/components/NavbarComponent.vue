<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ChevronDown, Gavel, LogOut, Menu } from 'lucide-vue-next'
import { useAuthStore } from '@/features/auth/states/authStore'
import { useUsersStore } from '@/features/users/states/usersStore'
import { showConfirmDialog } from '@/helpers/toolsHelper'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()
const users = useUsersStore()
const quickMenuOpen = ref(false)

async function onLogout() {
  quickMenuOpen.value = false
  const confirmed = await showConfirmDialog('Kamu akan keluar dari akun ini.', 'Keluar dari akun?')
  if (!confirmed) return
  auth.logout()
  users.profile = null
  users.user = null
  router.replace('/auth/login')
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
    <div class="flex h-16 items-center gap-3 px-4 lg:px-8">
      <button
        type="button"
        class="rounded-lg p-2 hover:bg-teal-wash lg:hidden"
        aria-label="Buka menu navigasi"
        @click="$emit('toggle-sidebar')"
      >
        <Menu :size="22" />
      </button>

      <RouterLink to="/" class="flex items-center gap-2.5 font-extrabold tracking-tight text-teal-deep">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-deep text-brass">
          <Gavel :size="20" />
        </span>
        <span class="hidden sm:inline">Delcom Auction</span>
      </RouterLink>

      <div class="ml-auto flex items-center gap-2">
        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-teal-wash"
            aria-haspopup="menu"
            :aria-expanded="quickMenuOpen"
            aria-label="Menu cepat akun"
            @click="quickMenuOpen = !quickMenuOpen"
          >
            <img
              v-if="users.profile?.photo"
              :src="users.profile.photo"
              alt=""
              class="h-9 w-9 rounded-full object-cover"
            />
            <span
              v-else
              class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-wash text-sm font-bold text-teal-deep"
              aria-hidden="true"
            >
              {{ (users.profile?.name || '?').charAt(0).toUpperCase() }}
            </span>
            <span class="hidden text-left leading-tight sm:block">
              <span class="block text-sm font-semibold">{{ users.profile?.name || 'Memuat…' }}</span>
              <span class="block text-xs text-ink-soft">{{ users.profile?.email }}</span>
            </span>
            <ChevronDown :size="16" class="text-ink-soft" />
          </button>

          <div
            v-if="quickMenuOpen"
            role="menu"
            class="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
          >
            <RouterLink to="/" role="menuitem" class="block px-4 py-2 text-sm hover:bg-teal-wash" @click="quickMenuOpen = false">
              Dashboard lelang
            </RouterLink>
            <RouterLink to="/profile" role="menuitem" class="block px-4 py-2 text-sm hover:bg-teal-wash" @click="quickMenuOpen = false">
              Profil saya
            </RouterLink>
          </div>
        </div>

        <button type="button" class="btn btn-ghost !px-3" aria-label="Keluar" @click="onLogout">
          <LogOut :size="18" />
          <span class="hidden md:inline">Keluar</span>
        </button>
      </div>
    </div>
  </header>
</template>
