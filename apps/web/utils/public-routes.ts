export const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']

export const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.some((route) => path === route)
