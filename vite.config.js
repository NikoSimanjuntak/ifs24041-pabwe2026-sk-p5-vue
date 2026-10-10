import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Mengubah <link rel="stylesheet"> hasil build menjadi non-blocking
// (preload lalu dipasang saat selesai), agar tidak menahan render pertama.
function nonBlockingCss() {
  return {
    name: 'non-blocking-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html.replace(
          /<link rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*)>/g,
          (_, before, href, after) =>
            `<link rel="preload" as="style"${before}href="${href}"${after} onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet"${before}href="${href}"${after}></noscript>`,
        ),
    },
  }
}

export default defineConfig(({ mode }) => {
  // prefix '' agar variabel non-VITE_ (APP_PORT) ikut terbaca
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss(), nonBlockingCss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || 'https://open-api.delcom.org/api/v1',
      ),
    },
    build: {
      target: 'esnext',
      sourcemap: true,
    },
    server: {
      port: Number(env.APP_PORT) || 5173,
    },
    preview: {
      port: Number(env.APP_PORT) || 5173,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{js,vue}'],
        exclude: [
          'src/main.js',
          'src/setupTests.js',
          'src/test-utils.js',
          'src/**/*.test.js',
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  }
})