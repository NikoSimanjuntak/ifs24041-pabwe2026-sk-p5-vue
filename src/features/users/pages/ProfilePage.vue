<script setup>
import { onMounted, ref, watch } from 'vue'
import { Camera, KeyRound, Save } from 'lucide-vue-next'
import { useInput } from '@/hooks/useInput'
import { useUsersStore } from '../states/usersStore'
import { showErrorDialog, showSuccessDialog } from '@/helpers/toolsHelper'

const store = useUsersStore()
const name = useInput('')
const email = useInput('')
const password = useInput('')
const newPassword = useInput('')
const confirmPassword = useInput('')
const errors = ref({})
const passwordErrors = ref({})

watch(
  () => store.profile,
  (profile) => {
    name.reset(profile?.name ?? '')
    email.reset(profile?.email ?? '')
  },
  { immediate: true },
)

onMounted(async () => {
  if (!store.profile) {
    const ok = await store.fetchProfile()
    if (!ok) showErrorDialog(store.errorMessage, 'Gagal memuat profil')
  }
})

async function onSubmitProfile() {
  const next = {}
  if (!name.value.value.trim()) next.name = 'Nama wajib diisi.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.value)) next.email = 'Masukkan alamat email yang valid.'
  errors.value = next
  if (Object.keys(next).length) return

  const ok = await store.changeProfile({ name: name.value.value.trim(), email: email.value.value })
  if (ok) showSuccessDialog('Profilmu sudah diperbarui.')
  else showErrorDialog(store.errorMessage, 'Gagal memperbarui profil')
}

async function onPhotoSelected(event) {
  const [file] = event.target.files
  if (!file) return
  const ok = await store.changePhoto(file)
  if (ok) showSuccessDialog('Foto profil sudah diganti.')
  else showErrorDialog(store.errorMessage, 'Gagal mengunggah foto')
}

async function onSubmitPassword() {
  const next = {}
  if (!password.value.value) next.password = 'Kata sandi saat ini wajib diisi.'
  if (newPassword.value.value.length < 6) next.newPassword = 'Kata sandi baru minimal 6 karakter.'
  if (confirmPassword.value.value !== newPassword.value.value)
    next.confirmPassword = 'Konfirmasi kata sandi tidak sama.'
  passwordErrors.value = next
  if (Object.keys(next).length) return

  const ok = await store.changePassword({
    password: password.value.value,
    new_password: newPassword.value.value,
  })
  if (ok) {
    password.reset()
    newPassword.reset()
    confirmPassword.reset()
    showSuccessDialog('Kata sandi sudah diganti.')
  } else {
    showErrorDialog(store.errorMessage, 'Gagal mengganti kata sandi')
  }
}
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="text-2xl font-extrabold tracking-tight">Profil saya</h1>
    <p class="mt-1 text-sm text-ink-soft">Kelola data akun, foto, dan kata sandimu.</p>

    <div class="mt-8 flex items-center gap-5 rounded-2xl border border-line bg-white p-5">
      <img
        v-if="store.profile?.photo"
        :src="store.profile.photo"
        alt="Foto profil"
        class="h-20 w-20 rounded-full object-cover"
      />
      <span
        v-else
        class="flex h-20 w-20 items-center justify-center rounded-full bg-teal-wash text-3xl font-bold text-teal-deep"
        aria-hidden="true"
      >
        {{ (store.profile?.name || '?').charAt(0).toUpperCase() }}
      </span>
      <div>
        <p class="text-lg font-bold">{{ store.profile?.name }}</p>
        <p class="text-sm text-ink-soft">{{ store.profile?.email }}</p>
        <label class="btn btn-ghost mt-3 cursor-pointer !py-1.5 text-xs">
          <Camera :size="14" />
          {{ store.isPhotoChange ? 'Mengunggah…' : 'Ganti foto' }}
          <input type="file" accept="image/*" class="sr-only" aria-label="Unggah foto profil" @change="onPhotoSelected" />
        </label>
      </div>
    </div>

    <form class="mt-6 space-y-5 rounded-2xl border border-line bg-white p-5" novalidate @submit.prevent="onSubmitProfile">
      <h2 class="font-bold">Data akun</h2>
      <div>
        <label for="profile-name" class="mb-1.5 block text-sm font-semibold">Nama</label>
        <input id="profile-name" type="text" class="field" :class="{ 'field-error': errors.name }" :value="name.value.value" @input="name.onChange" />
        <p v-if="errors.name" class="mt-1.5 text-xs text-brick">{{ errors.name }}</p>
      </div>
      <div>
        <label for="profile-email" class="mb-1.5 block text-sm font-semibold">Email</label>
        <input id="profile-email" type="email" class="field" :class="{ 'field-error': errors.email }" :value="email.value.value" @input="email.onChange" />
        <p v-if="errors.email" class="mt-1.5 text-xs text-brick">{{ errors.email }}</p>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="store.isProfileChange">
        <Save :size="16" />
        {{ store.isProfileChange ? 'Menyimpan…' : 'Simpan perubahan' }}
      </button>
    </form>

    <form class="mt-6 space-y-5 rounded-2xl border border-line bg-white p-5" novalidate @submit.prevent="onSubmitPassword">
      <h2 class="font-bold">Ganti kata sandi</h2>
      <div>
        <label for="current-password" class="mb-1.5 block text-sm font-semibold">Kata sandi saat ini</label>
        <input id="current-password" type="password" class="field" :class="{ 'field-error': passwordErrors.password }" :value="password.value.value" @input="password.onChange" />
        <p v-if="passwordErrors.password" class="mt-1.5 text-xs text-brick">{{ passwordErrors.password }}</p>
      </div>
      <div>
        <label for="new-password" class="mb-1.5 block text-sm font-semibold">Kata sandi baru</label>
        <input id="new-password" type="password" class="field" :class="{ 'field-error': passwordErrors.newPassword }" :value="newPassword.value.value" @input="newPassword.onChange" />
        <p v-if="passwordErrors.newPassword" class="mt-1.5 text-xs text-brick">{{ passwordErrors.newPassword }}</p>
      </div>
      <div>
        <label for="confirm-new-password" class="mb-1.5 block text-sm font-semibold">Konfirmasi kata sandi baru</label>
        <input id="confirm-new-password" type="password" class="field" :class="{ 'field-error': passwordErrors.confirmPassword }" :value="confirmPassword.value.value" @input="confirmPassword.onChange" />
        <p v-if="passwordErrors.confirmPassword" class="mt-1.5 text-xs text-brick">{{ passwordErrors.confirmPassword }}</p>
      </div>
      <button type="submit" class="btn btn-brass" :disabled="store.isPasswordChange">
        <KeyRound :size="16" />
        {{ store.isPasswordChange ? 'Menyimpan…' : 'Ganti kata sandi' }}
      </button>
    </form>
  </section>
</template>
