# Delcom Auction (Vue 3)

Aplikasi lelang berbasis **Vue 3 + JavaScript** dengan **bun**, **Vite**, **Pinia**, **Vue Router**, **Tailwind CSS v4**, dan **Vitest**.
Sumber data: <https://open-api.delcom.org/docs/1.0/api-aucations>

## Menjalankan

```bash
bun install
cp .env.example .env     # sesuaikan bila perlu
bun run dev              # http://localhost:$APP_PORT
```

| Variabel | Fungsi |
| --- | --- |
| `VITE_DELCOM_BASEURL` | Base URL REST API (`https://open-api.delcom.org/api/v1`), diteruskan sebagai konstanta global `DELCOM_BASEURL` lewat `define` di `vite.config.js` |
| `APP_PORT` | Port server lokal (dev & preview) |

## Skrip

| Perintah | Keterangan |
| --- | --- |
| `bun run dev` | Server pengembangan |
| `bun run build` | Build produksi |
| `bun run test` | Jalankan seluruh pengujian |
| `bun run coverage` | Pengujian + coverage v8 (threshold **100%**) |

## Struktur

```
src/
├─ helpers/        apiHelper.js, toolsHelper.js
├─ hooks/          useInput.js, useNow.js
├─ features/
│  ├─ auth/        api, states (authStore), layouts (AuthLayout), pages (Login, Register)
│  ├─ users/       api, states (usersStore), pages (Users, Profile)
│  ├─ aucations/   api, states (aucationsStore), layouts, components (+ modals), pages, utils.js
│  └─ common/pages NotFoundPage
├─ router.js  main.js  App.vue  index.css
└─ setupTests.js  test-utils.js
```

## Rute

| Rute | Halaman |
| --- | --- |
| `/auth/login`, `/auth/register` | Login, Registrasi (hanya tamu) |
| `/` | Dashboard lelang (tab, pencarian, kartu) |
| `/aucations/:aucationId` | Detail lelang & riwayat bid |
| `/users`, `/profile` | Direktori pengguna, profil |
| `/:pathMatch(.*)*` | 404 |

Rute terlindungi memerlukan token di `localStorage`; tanpa token pengguna diarahkan ke login.
