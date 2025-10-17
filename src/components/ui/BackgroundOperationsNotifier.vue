<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useBackgroundOperations } from '@/composables/useBackgroundOperations'
import { Brain, Loader2, X } from 'lucide-vue-next'
import { computed } from 'vue'

const { activeOperations, cancelOperation } = useBackgroundOperations()

const shouldShow = computed(() => activeOperations.value.length > 0)

const getOperationIcon = (type) => {
  switch (type) {
    case 'ncp-generation':
    case 'explanation-generation':
      return Brain
    default:
      return Loader2
  }
}

const getOperationProgress = (operation) => {
  if (operation.progress) return operation.progress
  
  // Calculate estimated progress based on time elapsed (rough estimation)
  const elapsed = Date.now() - operation.startTime
  const maxTime = 120000 // 2 minutes max estimate
  return Math.min(90, (elapsed / maxTime) * 100)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="shouldShow"
      class="fixed bottom-4 right-4 z-50 max-w-sm space-y-2"
    >
      <Card
        v-for="operation in activeOperations"
        :key="operation.id"
        class="bg-background border shadow-lg animate-in slide-in-from-right-full"
      >
        <CardContent class="p-4">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <component
                :is="getOperationIcon(operation.type)"
                class="h-5 w-5 text-primary animate-pulse"
              />
            </div>
            
            <div class="flex-1 min-w-0 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-foreground truncate">
                  {{ operation.title }}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="cancelOperation(operation.id)"
                  class="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <X class="h-3 w-3" />
                </Button>
              </div>
              
              <p class="text-xs text-muted-foreground">
                {{ operation.description }}
              </p>
              
              <Progress 
                :value="getOperationProgress(operation)" 
                class="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </Teleport>
</template>