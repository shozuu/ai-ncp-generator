<script setup>
import { cn } from '@/lib/utils'
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  class: {
    type: null,
    required: false,
  },
})

const progressPercentage = computed(() => {
  const percentage = (props.value / props.max) * 100
  return Math.min(100, Math.max(0, percentage))
})
</script>

<template>
  <div
    :class="cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
      props.class
    )"
  >
    <div
      class="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
      :style="`transform: translateX(-${100 - progressPercentage}%)`"
    />
  </div>
</template>