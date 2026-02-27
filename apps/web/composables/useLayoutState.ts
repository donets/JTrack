import { ref } from 'vue'

const sidebarCollapsed = ref(false)
const mobileDrawerOpen = ref(false)

export function useLayoutState() {
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
