import type { Config } from 'tailwindcss'

export default {
  content: [
    './app.vue',
    './components/**/*.{vue,ts}',
    './pages/**/*.vue',
    './composables/**/*.ts',
    './plugins/**/*.ts',
    './stores/**/*.ts'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        mist: '#f1f5f9',
        mint: '#10b981',
        flame: '#f97316'
      }
    }
  },
  plugins: []
} satisfies Config
