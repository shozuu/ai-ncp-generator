<script setup>
import Button from '@/components/ui/button/Button.vue'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import Switch from '@/components/ui/switch/Switch.vue'
import { useGenerationErrorHandler } from '@/composables/useGenerationErrorHandler'
import { ncpService } from '@/services/ncpService'
import { X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import AssistantModeForm from './AssistantModeForm.vue'
import ManualModeForm from './ManualModeForm.vue'

const isAssistantMode = ref(false)
const isSubmitting = ref(false)
const currentStep = ref('idle')
const abortController = ref(null)

const loadingMessages = computed(() => {
  switch (currentStep.value) {
    case 'parsing':
      return ['Parsing manual assessment data...']
    case 'generating':
      return [
        'Matching best diagnosis...',
        'Building NCP structure...',
        'Generating comprehensive care plan...',
      ]
    case 'saving':
      return ['Saving to database...']
    default:
      return ['Processing...']
  }
})

const { handleError, handleSuccess } = useGenerationErrorHandler()

const emit = defineEmits(['submit'])

const currentMode = computed(() =>
  isAssistantMode.value ? 'Assistant Mode' : 'Manual Mode'
)

const props = defineProps({
  selectedFormat: {
    type: String,
    default: '7',
  },
})

const cancelGeneration = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isSubmitting.value = false
  currentStep.value = 'idle'
  handleSuccess('cancelled')
}

const handleSubmit = async data => {
  isSubmitting.value = true

  // Create a new AbortController for this generation
  abortController.value = new AbortController()

  try {
    let structuredData

    if (isAssistantMode.value) {
      structuredData = {
        ...data,
        format: props.selectedFormat,
      }
    } else {
      currentStep.value = 'parsing'
      handleSuccess('processing')
      try {
        const parsedData = await ncpService.parseManualAssessment(
          data,
          abortController.value.signal
        )
        // Use the parsed data directly - it contains original_assessment + embedding_keywords
        structuredData = {
          ...parsedData,
          format: props.selectedFormat,
        }
        handleSuccess('processed')
      } catch (parseError) {
        // Check if it was cancelled
        if (
          parseError.name === 'AbortError' ||
          parseError.name === 'CanceledError'
        ) {
          return // Exit silently for cancellation
        }

        let suggestion = ''
        let errorMessage = parseError.message || ''
        if (errorMessage.includes('suggestion')) {
          const parts = errorMessage.split('suggestion:')
          if (parts.length > 1) {
            errorMessage = parts[0].replace('error:', '').trim()
            suggestion = parts[1].trim()
          }
        }
        handleError({ message: errorMessage }, { suggestion })
        isSubmitting.value = false
        return
      }
    }

    try {
      currentStep.value = 'generating'
      handleSuccess('generating')

      let result
      result = await ncpService.generateComprehensiveNCP(
        structuredData,
        abortController.value.signal
      )

      currentStep.value = 'saving'
      if (result.ncp) {
        const dataWithNCP = {
          generatedNCP: result.ncp,
          diagnosis: result.diagnosis,
          savedNCPId: result.savedNCPId,
        }
        handleSuccess('complete', result.diagnosis?.diagnosis)
        emit('submit', dataWithNCP)
      } else {
        const dataWithDiagnoses = {
          ...structuredData,
          diagnosis: result.diagnosis,
        }
        handleSuccess('partial', result.diagnosis?.diagnosis)
        emit('submit', dataWithDiagnoses)
      }
    } catch (comprehensiveError) {
      // Check if it was cancelled
      if (
        comprehensiveError.name === 'AbortError' ||
        comprehensiveError.name === 'CanceledError'
      ) {
        return // Exit silently for cancellation
      }
      handleError(comprehensiveError)
      emit('submit', structuredData)
    }
  } catch (error) {
    // Check if it was cancelled
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      return // Exit silently for cancellation
    }
    let suggestion = ''
    let errorMessage = error.message || ''
    if (errorMessage.includes('suggestion')) {
      const parts = errorMessage.split('suggestion:')
      if (parts.length > 1) {
        errorMessage = parts[0].replace('error:', '').trim()
        suggestion = parts[1].trim()
      }
    }
    handleError({ message: errorMessage }, { suggestion })
  } finally {
    isSubmitting.value = false
    currentStep.value = 'idle'
    abortController.value = null
  }
}

// Expose cancelGeneration for parent component
defineExpose({
  cancelGeneration,
})
</script>

<template>
  <!-- loading overlay -->
  <div
    v-if="isSubmitting"
    class="fixed inset-0 bg-background flex items-center justify-center z-50"
  >
    <div class="flex flex-col items-center space-y-6">
      <LoadingIndicator :messages="loadingMessages" />
      <Button
        variant="outline"
        @click="cancelGeneration"
        class="flex items-center gap-2"
      >
        <X class="h-4 w-4" />
        Cancel Generation
      </Button>
    </div>
  </div>

  <!-- Main content -->
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
