<script setup>
import { computed, onMounted } from 'vue'
import { Search, UsersRound } from 'lucide-vue-next'
import { useInput } from '@/hooks/useInput'
import { useUsersStore } from '../states/usersStore'
import { showErrorDialog } from '@/helpers/toolsHelper'

const store = useUsersStore()
const keyword = useInput('')

const filteredUsers = computed(() => {
  const query = keyword.value.value.trim().toLowerCase()
  return store.users.filter((user) =>
    `${user.name || ''} ${user.email || ''}`.toLowerCase().includes(query),
  )
})

onMounted(async () => {
  const ok = await store.fetchUsers()
  if (!ok) {
    showErrorDialog(store.errorMessage, 'Gagal memuat pengguna')
  }
})
</script>

<template>
  <section>
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">Daftar pengguna</h1>
        <p class="mt-1 text-sm text-ink-soft">Semua peserta yang terdaftar di Delcom Auction.</p>
      </div>
      <div class="relative w-full sm:w-72">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          placeholder="Cari nama atau email"
          aria-label="Cari pengguna"
          class="field pl-9"
          :value="keyword.value.value"
          @input="keyword.onChange"
        />
      </div>
    </header>

    <p v-if="store.isLoading" class="mt-10 text-center text-sm text-ink-soft">Memuat pengguna…</p>

    <div
      v-else-if="filteredUsers.length === 0"
      class="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center"
    >
      <UsersRound :size="36" class="text-ink-soft" />
      <p class="mt-3 font-semibold">Pengguna tidak ditemukan</p>
      <p class="mt-1 text-sm text-ink-soft">Coba kata kunci lain.</p>
    </div>

    <ul v-else class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li
        v-for="user in filteredUsers"
        :key="user.id"
        class="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"
      >
        <img
          v-if="user.photo"
          :src="user.photo"
          :alt="`Foto ${user.name}`"
          class="h-12 w-12 shrink-0 rounded-full object-cover"
        />
        <span
          v-else
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-wash text-lg font-bold text-teal-deep"
          aria-hidden="true"
        >
          {{ (user.name || '?').charAt(0).toUpperCase() }}
        </span>
        <div class="min-w-0">
          <p class="truncate font-semibold">{{ user.name }}</p>
          <p class="truncate text-sm text-ink-soft">{{ user.email }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
