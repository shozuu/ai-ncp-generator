<script setup>
const props = defineProps({
  text: {
    type: String,
    default: 'Loading...',
  },
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-8 space-y-4 text-center"
  >
    <div
      class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
    />
    <p class="text-sm text-muted-foreground">{{ props.text }}</p>
  </div>
</template>
