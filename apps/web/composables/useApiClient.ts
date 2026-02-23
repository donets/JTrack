interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  skipAuthRefresh?: boolean
}

export const useApiClient = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const locationStore = useLocationStore()

  const request = async <TResponse>(
    path: string,
    options: RequestOptions = {}
  ): Promise<TResponse> => {
    const headers: Record<string, string> = {
      ...(options.headers ?? {})
    }

    if (authStore.accessToken) {
      headers.authorization = `Bearer ${authStore.accessToken}`
    }

    if (locationStore.activeLocationId && !headers['x-location-id']) {
      headers['x-location-id'] = locationStore.activeLocationId
    }

    const fetchOptions: Record<string, unknown> = {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers
    }

    if (options.body !== undefined) {
      fetchOptions.body = options.body
    }

    try {
      return await $fetch<TResponse>(path, {
        baseURL: config.public.apiBase,
        ...fetchOptions
      } as never)
    } catch (error: any) {
      if (error?.status === 401 && !options.skipAuthRefresh) {
        const refreshed = await authStore.refreshAccessToken()

        if (refreshed) {
          return request<TResponse>(path, {
            ...options,
            skipAuthRefresh: true
          })
        }
      }

      throw error
    }
  }

  return {
    get: <TResponse>(path: string, headers?: Record<string, string>) =>
      request<TResponse>(path, { method: 'GET', headers }),
    post: <TResponse, TBody = unknown>(path: string, body?: TBody, headers?: Record<string, string>) =>
      request<TResponse>(path, { method: 'POST', body, headers }),
    patch: <TResponse, TBody = unknown>(path: string, body?: TBody, headers?: Record<string, string>) =>
      request<TResponse>(path, { method: 'PATCH', body, headers }),
    put: <TResponse, TBody = unknown>(path: string, body?: TBody, headers?: Record<string, string>) =>
      request<TResponse>(path, { method: 'PUT', body, headers }),
    delete: <TResponse>(path: string, headers?: Record<string, string>) =>
      request<TResponse>(path, { method: 'DELETE', headers })
  }
}
