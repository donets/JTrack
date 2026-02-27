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
        mint: {
          DEFAULT: '#10b981',
          light: '#d1fae5'
        },
        flame: {
          DEFAULT: '#f97316',
          light: '#ffedd5'
        },
        sky: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe'
        },
        rose: {
          DEFAULT: '#ef4444',
          light: '#fee2e2'
        },
        violet: {
          DEFAULT: '#8b5cf6',
          light: '#ede9fe'
        }
      },
      spacing: {
        sidebar: '240px',
        'sidebar-collapsed': '64px',
        topbar: '56px',
        'bottom-nav': '64px'
      },
    }
  },
  plugins: []
} satisfies Config
