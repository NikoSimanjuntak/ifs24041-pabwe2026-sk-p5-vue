import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getAccessToken, putAccessToken } from '@/helpers/apiHelper'
import * as authApi from '../api/authApi'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAccessToken() || '')
  const isAuthLogin = ref(false)
  const isAuthRegister = ref(false)
  const isAuthLogout = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const validation = ref({})

  const isAuthenticated = computed(() => Boolean(token.value))

  function resetStatus() {
    isAuthLogin.value = false
    isAuthRegister.value = false
    isAuthLogout.value = false
    errorMessage.value = ''
    validation.value = {}
  }

  function validateLogin({ email, password }) {
    const errors = {}
    if (!EMAIL_PATTERN.test(email || '')) errors.email = 'Masukkan alamat email yang valid.'
    if (!password) errors.password = 'Kata sandi wajib diisi.'
    validation.value = errors
    return Object.keys(errors).length === 0
  }

  function validateRegister({ name, email, password, confirmPassword }) {
    const errors = {}
    if (!name || !name.trim()) errors.name = 'Nama wajib diisi.'
    if (!EMAIL_PATTERN.test(email || '')) errors.email = 'Masukkan alamat email yang valid.'
    if (!password || password.length < 6) errors.password = 'Kata sandi minimal 6 karakter.'
    if (confirmPassword !== password) errors.confirmPassword = 'Konfirmasi kata sandi tidak sama.'
    validation.value = errors
    return Object.keys(errors).length === 0
  }

  async function login(payload) {
    resetStatus()
    if (!validateLogin(payload)) return false
    isLoading.value = true
    try {
      const response = await authApi.login(payload)
      token.value = response.data.token
      putAccessToken(token.value)
      isAuthLogin.value = true
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(payload) {
    resetStatus()
    if (!validateRegister(payload)) return false
    isLoading.value = true
    try {
      await authApi.register(payload)
      isAuthRegister.value = true
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    resetStatus()
    token.value = ''
    putAccessToken(null)
    isAuthLogout.value = true
  }

  return {
    token,
    isAuthLogin,
    isAuthRegister,
    isAuthLogout,
    isLoading,
    errorMessage,
    validation,
    isAuthenticated,
    resetStatus,
    validateLogin,
    validateRegister,
    login,
    register,
    logout,
  }
})
