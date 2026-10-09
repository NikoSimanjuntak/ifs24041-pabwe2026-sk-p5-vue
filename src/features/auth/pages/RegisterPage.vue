<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { UserPlus } from 'lucide-vue-next'
import { useInput } from '@/hooks/useInput'
import { useAuthStore } from '../states/authStore'
import { showErrorDialog, showSuccessDialog } from '@/helpers/toolsHelper'

const router = useRouter()
const auth = useAuthStore()
const name = useInput('')
const email = useInput('')
const password = useInput('')
const confirmPassword = useInput('')

async function onSubmit() {
  const ok = await auth.register({
    name: name.value.value,
    email: email.value.value,
    password: password.value.value,
    confirmPassword: confirmPassword.value.value,
  })
  if (ok) {
    await showSuccessDialog('Akunmu sudah dibuat. Silakan masuk.', 'Registrasi berhasil')
    router.push('/auth/login')
  } else if (auth.errorMessage) {
    showErrorDialog(auth.errorMessage, 'Registrasi gagal')
  }
}
</script>

<template>
  <section>
    <h1 class="text-3xl font-extrabold tracking-tight">Buat akun baru</h1>
    <p class="mt-2 text-sm text-ink-soft">Daftar untuk mulai menawar dan memasang lelang.</p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="onSubmit">
      <div>
        <label for="name" class="mb-1.5 block text-sm font-semibold">Nama lengkap</label>
        <input
          id="name"
          type="text"
          autocomplete="name"
          placeholder="Nama kamu"
          class="field"
          :class="{ 'field-error': auth.validation.name }"
          :value="name.value.value"
          @input="name.onChange"
        />
        <p v-if="auth.validation.name" class="mt-1.5 text-xs text-brick">{{ auth.validation.name }}</p>
      </div>

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
          autocomplete="new-password"
          placeholder="Minimal 6 karakter"
          class="field"
          :class="{ 'field-error': auth.validation.password }"
          :value="password.value.value"
          @input="password.onChange"
        />
        <p v-if="auth.validation.password" class="mt-1.5 text-xs text-brick">{{ auth.validation.password }}</p>
      </div>

      <div>
        <label for="confirmPassword" class="mb-1.5 block text-sm font-semibold">Konfirmasi kata sandi</label>
        <input
          id="confirmPassword"
          type="password"
          autocomplete="new-password"
          placeholder="Ulangi kata sandi"
          class="field"
          :class="{ 'field-error': auth.validation.confirmPassword }"
          :value="confirmPassword.value.value"
          @input="confirmPassword.onChange"
        />
        <p v-if="auth.validation.confirmPassword" class="mt-1.5 text-xs text-brick">
          {{ auth.validation.confirmPassword }}
        </p>
      </div>

      <button type="submit" class="btn btn-primary w-full" :disabled="auth.isLoading">
        <UserPlus :size="18" />
        {{ auth.isLoading ? 'Memproses…' : 'Daftar' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-ink-soft">
      Sudah punya akun?
      <RouterLink to="/auth/login" class="font-semibold text-teal-mid hover:underline">Masuk</RouterLink>
    </p>
  </section>
</template>
