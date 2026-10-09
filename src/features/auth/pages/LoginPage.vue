<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { LogIn } from 'lucide-vue-next'
import { useInput } from '@/hooks/useInput'
import { useAuthStore } from '../states/authStore'
import { showErrorDialog, showSuccessDialog } from '@/helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()
const email = useInput('')
const password = useInput('')

async function onSubmit() {
  const ok = await auth.login({ email: email.value.value, password: password.value.value })
  if (ok) {
    await showSuccessDialog('Selamat datang kembali di Delcom Auction.', 'Login berhasil')
    router.push('/')
  } else if (auth.errorMessage) {
    showErrorDialog(auth.errorMessage, 'Login gagal')
  }
}
</script>

<template>
  <section>
    <h1 class="text-3xl font-extrabold tracking-tight">Masuk ke akunmu</h1>
    <p class="mt-2 text-sm text-ink-soft">Gunakan email dan kata sandi yang terdaftar.</p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="email" class="mb-1.5 block text-sm font-semibold">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          placeholder="nama@email.com"
          class="field"
          :class="{ 'field-error': auth.validation.email }"
          :value="email.value.value"
          @input="email.onChange"
        />
        <p v-if="auth.validation.email" class="mt-1.5 text-xs text-brick">{{ auth.validation.email }}</p>
      </div>

      <div>
        <label for="password" class="mb-1.5 block text-sm font-semibold">Kata sandi</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          placeholder="Masukkan kata sandi"
          class="field"
          :class="{ 'field-error': auth.validation.password }"
          :value="password.value.value"
          @input="password.onChange"
        />
        <p v-if="auth.validation.password" class="mt-1.5 text-xs text-brick">{{ auth.validation.password }}</p>
      </div>

      <button type="submit" class="btn btn-primary w-full" :disabled="auth.isLoading">
        <LogIn :size="18" />
        {{ auth.isLoading ? 'Memproses…' : 'Masuk' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-ink-soft">
      Belum punya akun?
      <RouterLink to="/auth/register" class="font-semibold text-teal-mid hover:underline">Daftar sekarang</RouterLink>
    </p>
  </section>
</template>
