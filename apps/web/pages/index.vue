<script setup lang="ts">
const router = useRouter()

onMounted(() => {
  void router.replace('/dashboard')
})
</script>

<template>
  <span class="sr-only">Redirecting to dashboard</span>
</template>
