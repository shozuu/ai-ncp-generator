<script setup>
import AssessmentForm from '@/components/ncp/AssessmentForm.vue'
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import { useGenerationErrorHandler } from '@/composables/useGenerationErrorHandler'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const selectedFormat = ref('7')
const isLoading = ref(false)
const exampleFormatContainer = ref(null)
const router = useRouter()
const { handleError, handleSuccess } = useGenerationErrorHandler()

const handleFormatChange = format => {
  selectedFormat.value = format
}

const handleAssessmentSubmit = async formData => {
  isLoading.value = true
  try {
    if (formData.generatedNCP && formData.savedNCPId) {
      console.log(
        'Complete NCP generated, redirecting to:',
        formData.savedNCPId
      )
      handleSuccess('complete')
      router.push(`/ncps/${formData.savedNCPId}`)
      return
    }

    if (formData.diagnosis && !formData.generatedNCP) {
      // only diagnosis was generated - show partial success
      console.log('Only diagnosis was generated, handling fallback')
      handleSuccess('partial', formData.diagnosis.diagnosis)
      return
    }

    // fallback case - should rarely happen
    console.warn('Unexpected formData structure:', formData)
    handleSuccess('issue')
  } catch (error) {
    console.error('Error in handleAssessmentSubmit:', error)
    handleError(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (exampleFormatContainer.value) {
    exampleFormatContainer.value.__v_auto_animate = true
  }
})
</script>

<template>
  <PageHead title="- Generate NCP" />
  <SidebarLayout>
    <div v-if="isLoading" class="flex items-center justify-center h-screen">
      <LoadingIndicator :messages="['Fetching your newly created NCP...']" />
    </div>

    <div v-else>
      <!-- Page Title -->
      <h1 class="font-poppins text-3xl font-bold mb-2">
        Generate Nursing Care Plan
      </h1>
      <p class="text-muted-foreground mb-8">
        Create an AI-generated nursing care plan with intelligent diagnosis
        matching
      </p>

      <!-- Format & Assessment Section -->
      <div class="mb-10">
        <FormatSelector
          :format="selectedFormat"
          @update:format="handleFormatChange"
        />
      </div>

      <div class="mb-10">
        <AssessmentForm
          @submit="handleAssessmentSubmit"
          :selectedFormat="selectedFormat"
        />
      </div>
    </div>
  </SidebarLayout>
</template>
