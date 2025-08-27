<script setup>
import { useDarkMode } from '@/composables/useDarkMode'
import lottie from 'lottie-web'
import { onMounted, onUnmounted, ref, watch } from 'vue'

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
const hasAnimationFiles = ref(false)
const messageInterval = ref(null)

const { isDark } = useDarkMode()

const checkAnimationFiles = async () => {
  try {
    const response = await fetch('/loading-animation-light.json')
    hasAnimationFiles.value = response.ok
  } catch {
    hasAnimationFiles.value = false
  }
}

const loadAnimation = async () => {
  // Clean up previous instance
  if (animationInstance.value) {
    animationInstance.value.destroy()
    animationInstance.value = null
  }

  if (!hasAnimationFiles.value || !animationContainer.value) return

  const animationPath = isDark.value
    ? '/loading-animation-dark.json'
    : '/loading-animation-light.json'

  try {
    animationInstance.value = lottie.loadAnimation({
      container: animationContainer.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: animationPath,
    })
  } catch (error) {
    console.warn('Failed to load Lottie animation:', error)
    hasAnimationFiles.value = false
  }
}

const startMessageCycle = () => {
  // Clear any existing interval
  if (messageInterval.value) {
    clearInterval(messageInterval.value)
  }

  // Only start if we have multiple messages
  if (props.messages.length > 1) {
    let messageIndex = 0
    messageInterval.value = setInterval(() => {
      messageIndex = (messageIndex + 1) % props.messages.length
      currentMessage.value = props.messages[messageIndex]
    }, 2000)
  }
}

const cleanup = () => {
  if (messageInterval.value) {
    clearInterval(messageInterval.value)
    messageInterval.value = null
  }

  if (animationInstance.value) {
    animationInstance.value.destroy()
    animationInstance.value = null
  }
}

onMounted(async () => {
  await checkAnimationFiles()

  // Load animation immediately without artificial delay
  if (animationContainer.value && hasAnimationFiles.value) {
    await loadAnimation()
  }
  startMessageCycle()
})

onUnmounted(() => {
  cleanup()
})

// Watch for theme changes and reload the animation
watch(isDark, async () => {
  if (animationContainer.value && hasAnimationFiles.value) {
    await loadAnimation()
  }
})

// Watch for message changes
watch(
  () => props.messages,
  newMessages => {
    currentMessage.value = newMessages[0] || 'Loading...'
    startMessageCycle()
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center">
    <!-- Lottie Animation or Fallback -->
    <div
      v-if="hasAnimationFiles"
      ref="animationContainer"
      class="w-52 h-52"
    ></div>

    <!-- Fallback spinner if no animation files -->
    <div v-else class="w-52 h-52 flex items-center justify-center">
      <div class="relative">
        <div
          class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
        ></div>
        <div
          class="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/40 rounded-full animate-spin"
          style="animation-duration: 1.5s; animation-direction: reverse"
        ></div>
      </div>
    </div>

    <!-- Dynamic Message -->
    <p class="text-sm text-muted-foreground mt-4">{{ currentMessage }}</p>
  </div>
</template>
