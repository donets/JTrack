import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['stores/**/*.spec.ts', 'composables/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['stores/**/*.ts', 'composables/**/*.ts'],
      exclude: ['stores/**/*.spec.ts', 'composables/**/*.spec.ts']
    }
  }
})
