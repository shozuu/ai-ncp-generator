<script setup>
import AssessmentForm from '@/components/ncp/AssessmentForm.vue'
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import { useToast } from '@/components/ui/toast'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ncpService } from '@/services/ncpService'
import { ref } from 'vue'

const selectedFormat = ref('7')
const isLoading = ref(false)
const generatedNCP = ref(null)
const { toast } = useToast()

const handleFormatChange = format => {
  selectedFormat.value = format
}

const handleAssessmentSubmit = async formData => {
  isLoading.value = true
  generatedNCP.value = null

  try {
    const result = await ncpService.generateNCP(formData)
    generatedNCP.value = result
    toast({
      title: 'Success',
      description: 'NCP generated successfully',
    })
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <PageHead title="- Generate NCP" />
  <DefaultLayout>
    <div class="space-y-8">
      <div>
        <h1 class="font-poppins text-3xl font-bold">
          Generate Nursing Care Plan
        </h1>
        <p class="text-muted-foreground mt-2">
          Create an AI-generated nursing care plan based on patient data
        </p>
      </div>

      <!-- Format Selection -->
      <Card v-if="!generatedNCP">
        <CardHeader>
          <h3 class="text-lg font-semibold">Format Selection</h3>
          <p class="text-muted-foreground text-sm">
            Choose how many columns you want to display in your NCP
          </p>
        </CardHeader>
        <CardContent>
          <FormatSelector
            :format="selectedFormat"
            @update:format="handleFormatChange"
          />
        </CardContent>
      </Card>

      <!-- Assessment Form -->
      <Card v-if="!generatedNCP">
        <CardHeader>
          <h3 class="text-lg font-semibold">Patient Assessment</h3>
          <p class="text-muted-foreground text-sm">
            Enter your assessment details to generate an NCP
          </p>
        </CardHeader>
        <CardContent>
          <AssessmentForm
            @submit="handleAssessmentSubmit"
            :selectedFormat="selectedFormat"
          />
        </CardContent>
      </Card>

      <!-- Loading State -->
      <Card v-if="isLoading">
        <CardContent>
          <LoadingIndicator text="Generating your nursing care plan..." />
        </CardContent>
      </Card>

      <!-- Generated NCP Display -->
      <NCPDisplay
        v-if="generatedNCP && !isLoading"
        :ncp="generatedNCP"
        :format="selectedFormat"
      />
    </div>
  </DefaultLayout>
</template>
