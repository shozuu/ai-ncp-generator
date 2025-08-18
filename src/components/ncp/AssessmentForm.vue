<script setup>
import Switch from '@/components/ui/switch/Switch.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { computed, ref } from 'vue'
import AssistantModeForm from './AssistantModeForm.vue'
import ManualModeForm from './ManualModeForm.vue'

const isAssistantMode = ref(false)
const { toast } = useToast()

const emit = defineEmits(['submit'])

const currentMode = computed(() =>
  isAssistantMode.value ? 'Assistant Mode' : 'Manual Mode'
)

const handleSubmit = data => {
  emit('submit', data)
  console.log('Submitted Data:', data)
  toast({
    title: 'Success',
    description: 'Assessment submitted successfully',
  })
}
</script>

<template>
  <div class="p-6 space-y-6 bg-card rounded-lg shadow-md">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-muted pb-4 space-y-4 sm:space-y-0"
    >
      <div class="flex-1 min-w-0">
        <h4 class="text-base font-medium text-foreground">
          Use Assessment Assistant
        </h4>
        <p class="text-sm text-muted-foreground mt-1">
          Toggle to switch between manual and assistant modes
        </p>
      </div>
      <div
        class="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0"
      >
        <Switch id="assistant-mode" v-model="isAssistantMode" />
        <span
          class="px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap"
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
