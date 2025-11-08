<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useBackgroundOperations } from '@/composables/useBackgroundOperations'
import { Brain, Clock, Loader2, Sparkles, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const { activeOperations, cancelOperation } = useBackgroundOperations()

const shouldShow = computed(() => activeOperations.value.length > 0)

// Current time to force reactivity for timer updates
const currentTime = ref(Date.now())
let intervalId = null

// Update current time every second
onMounted(() => {
  intervalId = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

const getOperationIcon = type => {
  switch (type) {
    case 'ncp-generation':
    case 'explanation-generation':
      return Brain
    default:
      return Loader2
  }
}

const getOperationProgress = operation => {
  if (operation.progress) return operation.progress

  // Calculate estimated progress based on time elapsed (rough estimation)
  const elapsed = currentTime.value - operation.startTime
  const maxTime = 120000 // 2 minutes max estimate
  return Math.min(90, (elapsed / maxTime) * 100)
}

const getOperationDetails = type => {
  switch (type) {
    case 'ncp-generation':
      return {
        message:
          'AI is analyzing patient data and generating a comprehensive nursing care plan...',
        helpText:
          'This process involves multiple steps including diagnosis matching, intervention planning, and outcome definition. It may take 1-2 minutes.',
      }
    case 'explanation-generation':
      return {
        message:
          'AI is preparing detailed explanations for each nursing diagnosis...',
        helpText:
          'Each diagnosis requires thorough analysis and context-specific explanations. This typically takes 1-2 minutes.',
      }
    default:
      return {
        message: 'Processing your request...',
        helpText: 'Please wait while we complete this operation.',
      }
  }
}

const formatElapsedTime = operation => {
  const elapsed = Math.floor((currentTime.value - operation.startTime) / 1000)
  if (elapsed < 60) return `${elapsed}s`
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return `${minutes}m ${seconds}s`
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="shouldShow"
      class="fixed bottom-4 right-4 z-50 max-w-md space-y-2"
    >
      <Card
        v-for="operation in activeOperations"
        :key="operation.id"
        class="bg-background border-2 border-primary/20 shadow-xl animate-in slide-in-from-right-full"
      >
        <CardContent class="p-5">
          <!-- Header with icon, title, and close button -->
          <div class="flex items-start space-x-3 mb-4">
            <div class="flex-shrink-0">
              <div
                class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <component
                  :is="getOperationIcon(operation.type)"
                  class="h-5 w-5 text-primary animate-pulse"
                />
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm font-semibold text-foreground">
                  {{ operation.title }}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="cancelOperation(operation.id)"
                  class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
                  title="Cancel operation"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>

              <!-- Elapsed time badge -->
              <div
                class="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Clock class="h-3 w-3" />
                <span>{{ formatElapsedTime(operation) }}</span>
              </div>
            </div>
          </div>

          <!-- Main message -->
          <div class="space-y-3">
            <p class="text-sm text-foreground leading-relaxed">
              {{ getOperationDetails(operation.type).message }}
            </p>

            <!-- Progress bar with percentage -->
            <div class="space-y-1.5">
              <Progress
                :value="getOperationProgress(operation)"
                class="h-2.5"
              />
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground font-medium">
                  Processing...
                </span>
                <span class="text-primary font-semibold">
                  {{ Math.round(getOperationProgress(operation)) }}%
                </span>
              </div>
            </div>

            <!-- Help text with sparkles icon -->
            <div
              class="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/10"
            >
              <Sparkles class="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p class="text-xs text-muted-foreground leading-relaxed">
                {{ getOperationDetails(operation.type).helpText }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </Teleport>
</template>
