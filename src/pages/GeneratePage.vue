<script setup>
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import PatientAssessmentForm from '@/components/ncp/PatientAssessmentForm.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref } from 'vue'

const selectedFormat = ref('4')

const handleFormatChange = format => {
  selectedFormat.value = format
}

const handleAssessmentSubmit = formData => {
  console.log('Assessment Data:', formData)
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

      <!-- Patient Assessment Form -->
      <PatientAssessmentForm @submit="handleAssessmentSubmit" />
    </div>
  </DefaultLayout>
</template>
