<script setup>
import { useBackgroundOperations } from '@/composables/useBackgroundOperations'
import { useGenerationErrorHandler } from '@/composables/useGenerationErrorHandler'
import { ncpService } from '@/services/ncpService'
import { computed, ref } from 'vue'
import ManualModeForm from './ManualModeForm.vue'
const isSubmitting = ref(false)
const abortController = ref(null)

const {
  startOperation,
  completeOperation,
  failOperation,
  updateOperation,
  hasActiveOperationType,
} = useBackgroundOperations()
const { handleError, handleSuccess } = useGenerationErrorHandler()

const emit = defineEmits(['submit'])

// Check if NCP generation is currently running
const isNCPGenerationActive = computed(() =>
  hasActiveOperationType('ncp-generation')
)

const props = defineProps({
  selectedFormat: {
    type: String,
    default: '7',
  },
})

// This function is no longer needed as cancellation is handled by the background operations system

const handleSubmit = async data => {
  // Prevent multiple concurrent NCP generations
  if (isNCPGenerationActive.value) {
    handleError({
      message:
        'An NCP generation is already in progress. Please wait for it to complete or cancel it first.',
    })
    return
  }

  isSubmitting.value = true

  // Create a new AbortController for this generation
  abortController.value = new AbortController()

  // Generate unique operation ID
  const operationId = `ncp-generation-${Date.now()}`

  try {
    // Start background operation
    startOperation(operationId, 'ncp-generation', {
      title: 'NCP Generation',
      description: 'Parsing assessment data...',
      abortController: abortController.value,
      onComplete: result => {
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
            ...result.structuredData,
            diagnosis: result.diagnosis,
          }
          handleSuccess('partial', result.diagnosis?.diagnosis)
          emit('submit', dataWithDiagnoses)
        }
      },
      onError: error => {
        handleError(error)
      },
    })

    let structuredData

    // Step 1: Parse manual assessment
    updateOperation(operationId, {
      description: 'Parsing manual assessment data...',
      progress: 20,
    })

    try {
      const parsedData = await ncpService.parseManualAssessment(
        data,
        abortController.value.signal
      )
      structuredData = {
        ...parsedData,
        format: props.selectedFormat,
      }
    } catch (parseError) {
      // Check if it was cancelled
      if (
        parseError.name === 'AbortError' ||
        parseError.name === 'CanceledError'
      ) {
        return // Exit silently for cancellation
      }
      throw parseError
    }

    // Step 2: Generate NCP
    updateOperation(operationId, {
      description: 'Generating comprehensive care plan...',
      progress: 60,
    })

    try {
      const result = await ncpService.generateComprehensiveNCP(
        structuredData,
        abortController.value.signal
      )

      // Step 3: Complete
      updateOperation(operationId, {
        description: 'Finalizing NCP...',
        progress: 90,
      })

      // Complete the operation with the result
      completeOperation(operationId, {
        ...result,
        structuredData,
      })
    } catch (comprehensiveError) {
      // Check if it was cancelled
      if (
        comprehensiveError.name === 'AbortError' ||
        comprehensiveError.name === 'CanceledError'
      ) {
        return // Exit silently for cancellation
      }
      throw comprehensiveError
    }
  } catch (error) {
    // Check if it was cancelled
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      return // Exit silently for cancellation
    }

    // Handle other errors
    let suggestion = ''
    let errorMessage = error.message || ''
    if (errorMessage.includes('suggestion')) {
      const parts = errorMessage.split('suggestion:')
      if (parts.length > 1) {
        errorMessage = parts[0].replace('error:', '').trim()
        suggestion = parts[1].trim()
      }
    }

    failOperation(operationId, { message: errorMessage, suggestion })
  } finally {
    isSubmitting.value = false
    abortController.value = null
  }
}

// No need to expose cancellation - it's handled by background operations
</script>

<template>
  <!-- No more blocking overlay - operations run in background -->

  <!-- Main content -->
  <section class="space-y-8 w-full">
    <!-- Header Section -->
    <div>
      <div>
        <!-- Active generation warning -->
        <div
          v-if="isNCPGenerationActive"
          class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
        >
          <p class="text-amber-800 dark:text-amber-200 text-sm font-medium">
            🔄 NCP generation is running in the background. You can navigate
            freely, but please wait before starting a new generation.
          </p>
        </div>
      </div>
    </div>

    <!-- Form Section -->
    <div>
      <ManualModeForm
        @submit="handleSubmit"
        :disabled="isNCPGenerationActive"
      />
    </div>
  </section>
</template>
