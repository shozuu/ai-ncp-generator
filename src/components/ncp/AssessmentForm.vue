<script setup>
import Switch from '@/components/ui/switch/Switch.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { ncpService } from '@/services/ncpService'
import { computed, ref } from 'vue'
import AssistantModeForm from './AssistantModeForm.vue'
import ManualModeForm from './ManualModeForm.vue'

const isAssistantMode = ref(true)
const { toast } = useToast()

const emit = defineEmits(['submit'])

const currentMode = computed(() =>
  isAssistantMode.value ? 'Assistant Mode' : 'Manual Mode'
)

const handleSubmit = async data => {
  try {
    let structuredData

    if (isAssistantMode.value) {
      structuredData = data
    } else {
      toast({
        title: 'Processing',
        description: 'Analyzing and structuring your assessment data...',
      })

      try {
        structuredData = await ncpService.parseManualAssessment(data)

        toast({
          title: 'Success',
          description: 'Assessment data processed successfully',
        })
      } catch (parseError) {
        console.error('Parse error details:', parseError)

        // Extract detailed error information
        let errorMessage = 'Failed to process manual assessment data.'
        let suggestion = 'Please check your input format and try again.'

        if (parseError.message) {
          // Check if it's a detailed error from backend
          if (parseError.message.includes('suggestion')) {
            const parts = parseError.message.split('suggestion:')
            if (parts.length > 1) {
              errorMessage = parts[0].replace('error:', '').trim()
              suggestion = parts[1].trim()
            }
          } else {
            errorMessage = parseError.message
          }
        }

        toast({
          title: 'Processing Error',
          description: `${errorMessage} ${suggestion}`,
          variant: 'destructive',
        })
        return
      }
    }

    // Emit the structured data
    emit('submit', structuredData)
  } catch (error) {
    console.error('Assessment submission error:', error)

    // Extract detailed error information
    let errorMessage = 'Failed to process assessment data'
    let suggestion = ''

    if (error.message) {
      if (error.message.includes('suggestion')) {
        const parts = error.message.split('suggestion:')
        if (parts.length > 1) {
          errorMessage = parts[0].replace('error:', '').trim()
          suggestion = parts[1].trim()
        }
      } else {
        errorMessage = error.message
      }
    }

    toast({
      title: 'Error',
      description: `${errorMessage}${suggestion ? ` ${suggestion}` : ''}`,
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <section class="space-y-8 w-full">
    <!-- Assistant Toggle Section -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-muted"
    >
      <div>
        <h2 class="text-lg font-bold">Patient Assessment</h2>
        <p class="text-muted-foreground text-sm mb-4">
          Enter your assessment details to generate an NCP.
        </p>
      </div>

      <div class="flex items-center gap-2">
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

    <!-- Form Section -->
    <div>
      <AssistantModeForm v-if="isAssistantMode" @submit="handleSubmit" />
      <ManualModeForm v-else @submit="handleSubmit" />
    </div>
  </section>
</template>
