<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Clock, Gavel, Plus, Search, Trash2 } from 'lucide-vue-next'
import AddModal from '../components/modals/AddModal.vue'
import BidModal from '../components/modals/BidModal.vue'
import { useInput } from '@/hooks/useInput'
import { useNow } from '@/hooks/useNow'
import { useAucationsStore } from '../states/aucationsStore'
import { useUsersStore } from '@/features/users/states/usersStore'
import { getCountdown, getHighestBid, isClosed, isOwnedBy, matchesSearch, plainText } from '../utils'
import { formatRupiah, showConfirmDialog, showErrorDialog, showSuccessDialog } from '@/helpers/toolsHelper'

const TABS = [
  { key: 'all', label: 'Semua Lelang', filter: {} },
  { key: 'mine', label: 'Lelang Saya', filter: { is_me: 1 } },
  { key: 'open', label: 'Lelang Berlangsung', filter: { is_closed: 0 } },
  { key: 'closed', label: 'Lelang Ditutup', filter: { is_closed: 1 } },
]
const tabFromQuery = (value) => (TABS.some((tab) => tab.key === value) ? value : 'all')

const route = useRoute()
const store = useAucationsStore()
const users = useUsersStore()
const now = useNow()
const keyword = useInput('')
const activeTab = ref(tabFromQuery(route.query.tab))
const showAdd = ref(false)
const bidTarget = ref(null)

async function load() {
  const { filter } = TABS.find((tab) => tab.key === activeTab.value)
  const ok = await store.fetchAucations(filter)
  if (!ok) showErrorDialog(store.errorMessage, 'Gagal memuat lelang')
}

watch(activeTab, load, { immediate: true })
watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tabFromQuery(tab)
  },
)

const visibleAucations = computed(() =>
  store.aucations.filter((item) => matchesSearch(item, keyword.value.value)),
)

const canBid = (item) => !isClosed(item, now.value) && !isOwnedBy(item, users.profile?.id)

async function onDeleteAll() {
  const confirmed = await showConfirmDialog(
    'Semua lelang milikmu akan dihapus permanen.',
    'Hapus semua lelang saya?',
  )
  if (!confirmed) return
  const ok = await store.deleteAllAucations()
  if (ok) {
    showSuccessDialog('Semua lelang milikmu sudah dihapus.')
    load()
  } else {
    showErrorDialog(store.errorMessage, 'Gagal menghapus lelang')
  }
}
</script>

<template>
  <section>
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">Dashboard lelang</h1>
        <p class="mt-1 text-sm text-ink-soft">Temukan barang, ajukan tawaran, atau pasang lelangmu sendiri.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showAdd = true">
        <Plus :size="18" />
        Tambah lelang
      </button>
    </header>

    <div class="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="tablist" aria-label="Filter lelang" class="flex flex-wrap gap-2">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          class="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
          :class="activeTab === tab.key ? 'border-teal-deep bg-teal-deep text-white' : 'border-line bg-white hover:bg-teal-wash'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="relative w-full lg:w-80">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          placeholder="Cari judul atau deskripsi"
          aria-label="Cari lelang"
          class="field pl-9"
          :value="keyword.value.value"
          @input="keyword.onChange"
        />
      </div>
    </div>

    <div v-if="activeTab === 'mine' && visibleAucations.length" class="mt-4">
      <button type="button" class="btn btn-ghost !text-brick" @click="onDeleteAll">
        <Trash2 :size="16" />
        Hapus semua lelang saya
      </button>
    </div>

    <p v-if="store.isAucation" class="mt-12 text-center text-sm text-ink-soft">Memuat lelang…</p>

    <div
      v-else-if="visibleAucations.length === 0"
      class="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center"
    >
      <Gavel :size="36" class="text-ink-soft" />
      <p class="mt-3 font-semibold">Belum ada lelang di sini</p>
      <p class="mt-1 max-w-sm text-sm text-ink-soft">
        Ubah filter atau kata kunci pencarian, atau tambahkan lelang pertamamu.
      </p>
    </div>

    <ul v-else class="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <li
        v-for="item in visibleAucations"
        :key="item.id"
        class="flex flex-col overflow-hidden rounded-2xl border border-line bg-white"
        data-testid="aucation-card"
      >
        <RouterLink
          :to="`/aucations/${item.id}`"
          :aria-label="`Lihat detail ${item.title}`"
          class="block aspect-[16/10] bg-teal-wash"
        >
          <img v-if="item.cover" :src="item.cover" :alt="`Cover ${item.title}`" decoding="async" class="h-full w-full object-cover" />
          <span v-else class="flex h-full w-full items-center justify-center text-teal-mid/50">
            <Gavel :size="44" />
          </span>
        </RouterLink>

        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <h2 class="font-bold leading-snug">{{ item.title }}</h2>
            <span
              class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="isClosed(item, now) ? 'bg-brick-wash text-brick' : 'bg-teal-wash text-teal-deep'"
            >
              <Clock :size="12" />
              {{ getCountdown(item, now) }}
            </span>
          </div>
          <p class="mt-2 line-clamp-2 text-sm text-ink-soft">{{ plainText(item.description) }}</p>

          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-xs text-ink-soft">Harga awal</dt>
              <dd class="font-semibold">{{ formatRupiah(item.start_bid) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-soft">Tawaran tertinggi</dt>
              <dd class="font-bold text-teal-deep">{{ formatRupiah(getHighestBid(item)) }}</dd>
            </div>
          </dl>

          <div class="mt-5 flex gap-2 pt-1">
            <RouterLink :to="`/aucations/${item.id}`" class="btn btn-ghost flex-1">Lihat detail</RouterLink>
            <button v-if="canBid(item)" type="button" class="btn btn-brass flex-1" @click="bidTarget = item">
              Tawar
            </button>
          </div>
        </div>
      </li>
    </ul>

    <AddModal :open="showAdd" @close="showAdd = false" @saved="load" />
    <BidModal v-if="bidTarget" :open="true" :aucation="bidTarget" @close="bidTarget = null" @saved="load" />
  </section>
</template>