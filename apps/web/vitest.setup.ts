import { vi } from 'vitest'

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    apiBase: 'http://localhost:3001'
  }
}))
