import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as userApi from '../api/userApi'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const user = ref(null)
  const profile = ref(null)
  const isLoading = ref(false)
  const isProfileChange = ref(false)
  const isProfileChanged = ref(false)
  const isPhotoChange = ref(false)
  const isPhotoChanged = ref(false)
  const isPasswordChange = ref(false)
  const isPasswordChanged = ref(false)
  const errorMessage = ref('')

  function resetStatus() {
    isProfileChanged.value = false
    isPhotoChanged.value = false
    isPasswordChanged.value = false
    errorMessage.value = ''
  }

  async function run(loadingRef, task) {
    loadingRef.value = true
    errorMessage.value = ''
    try {
      await task()
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      loadingRef.value = false
    }
  }

  const fetchUsers = (query) =>
    run(isLoading, async () => {
      const response = await userApi.getUsers(query)
      users.value = response.data.users
    })

  const fetchProfile = () =>
    run(isLoading, async () => {
      const response = await userApi.getMe()
      profile.value = response.data.user
      user.value = response.data.user
    })

  async function changeProfile(payload) {
    isProfileChanged.value = false
    const ok = await run(isProfileChange, () => userApi.updateMe(payload))
    if (ok) {
      profile.value = { ...profile.value, ...payload }
      isProfileChanged.value = true
    }
    return ok
  }

  async function changePhoto(file) {
    isPhotoChanged.value = false
    const ok = await run(isPhotoChange, () => userApi.updatePhoto(file))
    if (ok) {
      isPhotoChanged.value = true
      await fetchProfile()
    }
    return ok
  }

  async function changePassword(payload) {
    isPasswordChanged.value = false
    const ok = await run(isPasswordChange, () => userApi.updatePassword(payload))
    isPasswordChanged.value = ok
    return ok
  }

  return {
    users,
    user,
    profile,
    isLoading,
    isProfileChange,
    isProfileChanged,
    isPhotoChange,
    isPhotoChanged,
    isPasswordChange,
    isPasswordChanged,
    errorMessage,
    resetStatus,
    fetchUsers,
    fetchProfile,
    changeProfile,
    changePhoto,
    changePassword,
  }
})
