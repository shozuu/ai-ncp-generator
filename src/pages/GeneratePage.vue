<script setup>
import AssessmentForm from '@/components/ncp/AssessmentForm.vue'
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref } from 'vue'

const selectedFormat = ref('4')

const handleFormatChange = format => {
  selectedFormat.value = format
}

const handleAssessmentSubmit = formData => {
  console.log('Assessment Data:', {
    format: formData.format,
    data: {
      subjective: formData.data.subjective,
      objective: formData.data.objective,
    },
    metadata: formData.metadata,
  })
  // TODO: Will implement API call to generate NCP here
}
</script>

<template>
  <PageHead title="- Generate NCP" />
  <DefaultLayout>
    <div class="space-y-8">
      <div>
        <h1 class="text-3xl font-bold font-poppins">
          Generate Nursing Care Plan
        </h1>
        <p class="mt-2 text-muted-foreground">
          Create an AI-generated nursing care plan based on patient data
        </p>
      </div>

      <!-- Format Selection -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Format Selection</h3>
          <p class="text-sm text-muted-foreground">
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
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Patient Assessment</h3>
          <p class="text-sm text-muted-foreground">
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
    </div>
  </DefaultLayout>
</template>
