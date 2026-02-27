export function useLayoutState() {
  const sidebarCollapsed = useState<boolean>('layout-sidebar-collapsed', () => false)
  const mobileDrawerOpen = useState<boolean>('layout-mobile-drawer-open', () => false)

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }

  const toggleSidebarCollapsed = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setMobileDrawerOpen = (open: boolean) => {
    mobileDrawerOpen.value = open
  }

  const openMobileDrawer = () => {
    mobileDrawerOpen.value = true
  }

  const closeMobileDrawer = () => {
    mobileDrawerOpen.value = false
  }

  const toggleMobileDrawer = () => {
    mobileDrawerOpen.value = !mobileDrawerOpen.value
  }

  return {
    sidebarCollapsed,
    mobileDrawerOpen,
    setSidebarCollapsed,
    toggleSidebarCollapsed,
    setMobileDrawerOpen,
    openMobileDrawer,
    closeMobileDrawer,
    toggleMobileDrawer
  }
}
