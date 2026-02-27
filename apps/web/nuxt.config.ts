import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
    shim: false,
    tsConfig: {
      extends: '@jtrack/tsconfig/web.json',
      compilerOptions: {
        exactOptionalPropertyTypes: false,
        noUncheckedIndexedAccess: false
      }
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001'
    }
  },
  app: {
    head: {
      title: 'JTrack CRM',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/login': { prerender: true },
    '/**': { prerender: false }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'JTrack Field Service CRM',
      short_name: 'JTrack',
      theme_color: '#0f172a',
      background_color: '#f8fafc',
      display: 'standalone',
      start_url: '/'
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true
    }
  }
})
