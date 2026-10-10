import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'

const app = createApp(App).use(createPinia()).use(router)

// Tunggu rute pertama (termasuk chunk lazy-nya) siap supaya konten awal
// di index.html tetap tampil dan halaman tidak pernah kosong.
router.isReady().then(() => app.mount('#app'))