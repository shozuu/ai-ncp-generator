<script setup>
import Switch from '@/components/ui/switch/Switch.vue'
import { useGenerationErrorHandler } from '@/composables/useGenerationErrorHandler'
import { ncpService } from '@/services/ncpService'
import { computed, ref } from 'vue'
import AssistantModeForm from './AssistantModeForm.vue'
import ManualModeForm from './ManualModeForm.vue'

const isAssistantMode = ref(true)
const { handleError, handleSuccess } = useGenerationErrorHandler()

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
      handleSuccess('processing')
      try {
        structuredData = await ncpService.parseManualAssessment(data)
        handleSuccess('processed')
      } catch (parseError) {
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
        return
      }
    }

    try {
      handleSuccess('generating')
      const result = await ncpService.generateComprehensiveNCP(structuredData)
      if (result.ncp) {
        const dataWithNCP = {
          generatedNCP: result.ncp,
          originalStructuredNCP: result.originalStructuredNCP,
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
      handleError(comprehensiveError)
      emit('submit', structuredData)
    }
  } catch (error) {
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
