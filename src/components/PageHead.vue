<script setup>
import { watchEffect } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
})

const APP_NAME = 'SmartCare'

watchEffect(() => {
  document.title = props.title ? `${APP_NAME} ${props.title}` : APP_NAME
})
</script>

<template>
  <div>
    <!-- Head is a logical component, no template needed -->
  </div>
</template>
