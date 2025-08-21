<script setup>
import { useDarkMode } from '@/composables/useDarkMode'
import lottie from 'lottie-web'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: 'Loading...',
  },
  messages: {
    type: Array,
    default: () => [
      'Preparing your nursing care plan...',
      'Analyzing patient data...',
      'Generating recommendations...',
    ],
  },
})

const currentMessage = ref(props.messages[0])
const animationContainer = ref(null)
const animationInstance = ref(null)

const { isDark } = useDarkMode()

const loadAnimation = () => {
  // Destroy the previous animation instance if it exists
  if (animationInstance.value) {
    animationInstance.value.destroy()
  }

  // Load the appropriate Lottie animation based on the theme
  const animationPath = isDark.value
    ? './public/loading-animation-dark.json'
    : './public/loading-animation-light.json'

  animationInstance.value = lottie.loadAnimation({
    container: animationContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: animationPath,
  })
}

onMounted(() => {
  loadAnimation()

  // Cycle through messages
  let index = 0
  setInterval(() => {
    index = (index + 1) % props.messages.length
    currentMessage.value = props.messages[index]
  }, 2000)
})

// Watch for theme changes and reload the animation
watch(isDark, () => {
  loadAnimation()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center">
    <!-- Lottie Animation -->
    <div ref="animationContainer" class="w-52 h-52"></div>

    <!-- Dynamic Message -->
    <p class="text-sm text-muted-foreground">{{ currentMessage }}</p>
  </div>
</template>
