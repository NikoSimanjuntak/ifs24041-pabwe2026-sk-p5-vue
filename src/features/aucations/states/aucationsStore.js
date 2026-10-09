import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as aucationApi from '../api/aucationApi'

export const useAucationsStore = defineStore('aucations', () => {
  const aucations = ref([])
  const aucation = ref(null)
  const isAucation = ref(false)
  const errorMessage = ref('')

  const isAucationAdd = ref(false)
  const isAucationAdded = ref(false)
  const isAucationChange = ref(false)
  const isAucationChanged = ref(false)
  const isAucationChangeCover = ref(false)
  const isAucationChangedCover = ref(false)
  const isAucationDelete = ref(false)
  const isAucationDeleted = ref(false)
  const isBidAdd = ref(false)
  const isBidAdded = ref(false)
  const isBidDelete = ref(false)
  const isBidDeleted = ref(false)
  const isAucationDeleteAll = ref(false)
  const isAucationDeletedAll = ref(false)

  function resetStatus() {
    isAucationAdded.value = false
    isAucationChanged.value = false
    isAucationChangedCover.value = false
    isAucationDeleted.value = false
    isBidAdded.value = false
    isBidDeleted.value = false
    isAucationDeletedAll.value = false
    errorMessage.value = ''
  }

  // Menjalankan aksi, mengelola flag proses (loading) dan flag hasil (done).
  async function mutate(loading, done, task) {
    done.value = false
    loading.value = true
    errorMessage.value = ''
    try {
      await task()
      done.value = true
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchAucations(filter = {}) {
    isAucation.value = true
    errorMessage.value = ''
    try {
      const response = await aucationApi.getAucations(filter)
      aucations.value = response.data.aucations
      return true
    } catch (error) {
      errorMessage.value = error.message
      return false
    } finally {
      isAucation.value = false
    }
  }

  async function fetchAucation(id) {
    isAucation.value = true
    errorMessage.value = ''
    try {
      const response = await aucationApi.getAucation(id)
      aucation.value = response.data.aucation
      return true
    } catch (error) {
      errorMessage.value = error.message
      aucation.value = null
      return false
    } finally {
      isAucation.value = false
    }
  }

  const addAucation = (payload) =>
    mutate(isAucationAdd, isAucationAdded, () => aucationApi.postAucation(payload))

  const changeAucation = (id, payload) =>
    mutate(isAucationChange, isAucationChanged, () => aucationApi.putAucation(id, payload))

  const changeCover = (id, file) =>
    mutate(isAucationChangeCover, isAucationChangedCover, () => aucationApi.postCover(id, file))

  const deleteAucation = (id) =>
    mutate(isAucationDelete, isAucationDeleted, () => aucationApi.deleteAucation(id))

  const addBid = (id, bid) => mutate(isBidAdd, isBidAdded, () => aucationApi.postBid(id, bid))

  const deleteBid = (id) => mutate(isBidDelete, isBidDeleted, () => aucationApi.deleteBid(id))

  const deleteAllAucations = () =>
    mutate(isAucationDeleteAll, isAucationDeletedAll, () => aucationApi.deleteAllAucations())

  return {
    aucations,
    aucation,
    isAucation,
    errorMessage,
    isAucationAdd,
    isAucationAdded,
    isAucationChange,
    isAucationChanged,
    isAucationChangeCover,
    isAucationChangedCover,
    isAucationDelete,
    isAucationDeleted,
    isBidAdd,
    isBidAdded,
    isBidDelete,
    isBidDeleted,
    isAucationDeleteAll,
    isAucationDeletedAll,
    resetStatus,
    fetchAucations,
    fetchAucation,
    addAucation,
    changeAucation,
    changeCover,
    deleteAucation,
    addBid,
    deleteBid,
    deleteAllAucations,
  }
})
