<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Clock, Gavel, ImageUp, Pencil, Trash2, Undo2 } from 'lucide-vue-next'
import ChangeModal from '../components/modals/ChangeModal.vue'
import ChangeCoverModal from '../components/modals/ChangeCoverModal.vue'
import BidModal from '../components/modals/BidModal.vue'
import { useAucationsStore } from '../states/aucationsStore'
import { useUsersStore } from '@/features/users/states/usersStore'
import { useNow } from '@/hooks/useNow'
import { getBidderName, getBids, getCountdown, getHighestBid, isClosed, isOwnedBy } from '../utils'
import {
  formatDate,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from '@/helpers/toolsHelper'

// Viewer Markdown (toast-ui) berat, jadi dimuat terpisah dari halaman
const MarkdownViewer = defineAsyncComponent(() => import('../components/MarkdownViewer.vue'))

const route = useRoute()
const router = useRouter()
const store = useAucationsStore()
const users = useUsersStore()
const now = useNow()

const showChange = ref(false)
const showCover = ref(false)
const showBid = ref(false)

const item = computed(() => store.aucation)
const isOwner = computed(() => isOwnedBy(item.value, users.profile?.id))
const closed = computed(() => isClosed(item.value, now.value))
const bids = computed(() =>
  [...getBids(item.value)].sort((a, b) => Number(b.bid) - Number(a.bid)),
)
const myBid = computed(() => bids.value.find((bid) => bid.user_id === users.profile?.id))

async function load() {
  const ok = await store.fetchAucation(route.params.aucationId)
  if (!ok) showErrorDialog(store.errorMessage, 'Gagal memuat detail lelang')
}

watch(() => route.params.aucationId, load, { immediate: true })

async function onDelete() {
  const confirmed = await showConfirmDialog('Lelang ini akan dihapus permanen.', 'Hapus lelang?')
  if (!confirmed) return
  const ok = await store.deleteAucation(item.value.id)
  if (ok) {
    showSuccessDialog('Lelang sudah dihapus.')
    router.push('/')
  } else {
    showErrorDialog(store.errorMessage, 'Gagal menghapus lelang')
  }
}

async function onCancelBid() {
  const confirmed = await showConfirmDialog('Tawaranmu pada lelang ini akan dibatalkan.', 'Batalkan tawaran?')
  if (!confirmed) return
  const ok = await store.deleteBid(item.value.id)
  if (ok) {
    showSuccessDialog('Tawaranmu sudah dibatalkan.')
    load()
  } else {
    showErrorDialog(store.errorMessage, 'Gagal membatalkan tawaran')
  }
}
</script>

<template>
  <section>
    <RouterLink to="/" class="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-mid hover:underline">
      <ArrowLeft :size="16" />
      Kembali ke daftar lelang
    </RouterLink>

    <p v-if="store.isAucation" class="mt-12 text-center text-sm text-ink-soft">Memuat detail lelang…</p>

    <div
      v-else-if="!item"
      class="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center"
    >
      <Gavel :size="36" class="text-ink-soft" />
      <p class="mt-3 font-semibold">Lelang tidak ditemukan</p>
      <p class="mt-1 text-sm text-ink-soft">Lelang ini mungkin sudah dihapus oleh pemiliknya.</p>
    </div>

    <div v-else class="mt-6 grid gap-8 xl:grid-cols-[1.4fr_1fr]">
      <article>
        <div class="aspect-[16/9] overflow-hidden rounded-2xl border border-line bg-teal-wash">
          <img v-if="item.cover" :src="item.cover" :alt="`Cover ${item.title}`" class="h-full w-full object-cover" />
          <span v-else class="flex h-full w-full items-center justify-center text-teal-mid/50">
            <Gavel :size="64" />
          </span>
        </div>

        <h1 class="mt-6 text-3xl font-extrabold tracking-tight">{{ item.title }}</h1>
        <div class="mt-5 rounded-2xl border border-line bg-white p-5">
          <MarkdownViewer :content="item.description" />
        </div>
      </article>

      <aside class="space-y-6">
        <div class="rounded-2xl border border-line bg-white p-5">
          <span
            class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="closed ? 'bg-brick-wash text-brick' : 'bg-teal-wash text-teal-deep'"
          >
            <Clock :size="12" />
            {{ getCountdown(item, now) }}
          </span>
          <p class="mt-4 text-xs text-ink-soft">Tawaran tertinggi</p>
          <p class="text-3xl font-extrabold text-teal-deep">{{ formatRupiah(getHighestBid(item)) }}</p>
          <p class="mt-2 text-sm text-ink-soft">
            Harga awal {{ formatRupiah(item.start_bid) }} · Ditutup {{ formatDate(item.closed_at) }}
          </p>

          <div v-if="!isOwner && !closed" class="mt-5 space-y-2">
            <button type="button" class="btn btn-brass w-full" @click="showBid = true">Ajukan tawaran</button>
            <button v-if="myBid" type="button" class="btn btn-ghost w-full" @click="onCancelBid">
              <Undo2 :size="16" />
              Batalkan tawaranku
            </button>
          </div>

          <div v-if="isOwner" class="mt-5 grid gap-2">
            <button type="button" class="btn btn-primary" @click="showChange = true">
              <Pencil :size="16" />
              Ubah lelang
            </button>
            <button type="button" class="btn btn-ghost" @click="showCover = true">
              <ImageUp :size="16" />
              Ganti cover
            </button>
            <button type="button" class="btn btn-danger" @click="onDelete">
              <Trash2 :size="16" />
              Hapus lelang
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-line bg-white p-5">
          <h2 class="font-bold">Riwayat penawaran</h2>
          <p v-if="bids.length === 0" class="mt-3 text-sm text-ink-soft">
            Belum ada penawaran. Jadilah yang pertama menawar.
          </p>
          <ol v-else class="mt-3 divide-y divide-line">
            <li v-for="bid in bids" :key="bid.id" class="flex items-center justify-between gap-3 py-3 text-sm">
              <div class="min-w-0">
                <p class="truncate font-semibold">{{ getBidderName(bid) }}</p>
                <p class="text-xs text-ink-soft">{{ formatDate(bid.created_at) }}</p>
              </div>
              <p class="shrink-0 font-bold">{{ formatRupiah(bid.bid) }}</p>
            </li>
          </ol>
        </div>
      </aside>
    </div>

    <template v-if="item">
      <ChangeModal :open="showChange" :aucation="item" @close="showChange = false" @saved="load" />
      <ChangeCoverModal :open="showCover" :aucation="item" @close="showCover = false" @saved="load" />
      <BidModal :open="showBid" :aucation="item" @close="showBid = false" @saved="load" />
    </template>
  </section>
</template>