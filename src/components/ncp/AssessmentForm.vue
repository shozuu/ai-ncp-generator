<script setup>
import Switch from '@/components/ui/switch/Switch.vue'
import { useToast } from '@/components/ui/toast'
import { ref, computed } from 'vue'
import AssistantModeForm from './AssistantModeForm.vue'
import ManualModeForm from './ManualModeForm.vue'

const isAssistantMode = ref(false)
const { toast } = useToast()

// Compute the current mode label
const currentMode = computed(() =>
  isAssistantMode.value ? 'Assistant Mode' : 'Manual Mode'
)

const handleSubmit = data => {
  console.log('Submitted Data:', data)
  toast({
    title: 'Success',
    description: 'Assessment submitted successfully',
  })
}
</script>

<template>
  <div class="p-6 space-y-6 bg-card rounded-lg shadow-md">
    <!-- Mode Toggle with Current Mode Indicator -->
    <div class="flex items-center justify-between border-b border-muted pb-4">
      <div>
        <h4 class="text-base font-medium text-foreground">
          Use Assessment Assistant
        </h4>
        <p class="text-sm text-muted-foreground">
          Toggle to switch between manual and assistant modes
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <Switch id="assistant-mode" v-model="isAssistantMode" />
        <span
          class="px-3 py-1 text-sm font-medium rounded-full"
          :class="
            isAssistantMode
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          "
        >
          {{ currentMode }}
        </span>
      </div>
    </div>

    <!-- Render Form Based on Mode -->
    <div class="pt-4">
      <div v-if="isAssistantMode">
        <AssistantModeForm @submit="handleSubmit" />
      </div>
      <div v-else>
        <ManualModeForm @submit="handleSubmit" />
      </div>
    </div>
  </div>
</template>
