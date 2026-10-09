<script setup>
import { onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import NavbarComponent from '../components/NavbarComponent.vue'
import SidebarComponent from '../components/SidebarComponent.vue'
import { useAuthStore } from '@/features/auth/states/authStore'
import { useUsersStore } from '@/features/users/states/usersStore'

const router = useRouter()
const auth = useAuthStore()
const users = useUsersStore()
const sidebarOpen = ref(false)

onMounted(async () => {
  const ok = await users.fetchProfile()
  if (!ok) {
    // Token tidak valid / kedaluwarsa: kembalikan ke halaman login
    auth.logout()
    router.replace('/auth/login')
  }
})
</script>

<template>
  <div class="min-h-screen bg-paper">
    <NavbarComponent @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="lg:flex">
      <SidebarComponent :open="sidebarOpen" @close="sidebarOpen = false" />
      <main class="min-w-0 flex-1 px-4 py-8 lg:px-10">
        <RouterView />
      </main>
    </div>
  </div>
</template>
