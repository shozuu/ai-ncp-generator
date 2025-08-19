<script setup>
import AssessmentForm from '@/components/ncp/AssessmentForm.vue'
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import { Alert, AlertTitle } from '@/components/ui/alert'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { ncpService } from '@/services/ncpService'
import { vAutoAnimate } from '@formkit/auto-animate'
import { ChevronDown, ChevronUp, ClipboardMinus, Info } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const selectedFormat = ref('7')
const isLoading = ref(false)
const generatedNCP = ref(null)
const showGuidance = ref(false)
const exampleFormatContainer = ref(null)
const { toast } = useToast()

const formattingTips = [
  'Enter each finding on a new line.',
  'Use clear and concise statements.',
  'Separate distinct observations for better clarity.',
]

const exampleFormat = [
  {
    label: 'Subjective Data:',
    icon: ClipboardMinus,
    items: [
      'Reports severe headache, described as throbbing (8/10 on pain scale)',
      'States nausea and dizziness began this morning',
      'Complains of photophobia (sensitivity to light)',
    ],
  },
  {
    label: 'Objective Data:',
    icon: ClipboardMinus,
    items: [
      'Blood pressure: 140/90 mmHg',
      'Temperature: 38.5°C',
      'Pupils equal and reactive to light (PERL)',
      'Facial grimacing observed during head movement',
    ],
  },
]

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

const handleCancel = () => {
  isLoading.value = false
  toast({
    title: 'Cancelled',
    description: 'NCP generation was cancelled.',
    variant: 'default',
  })
}

const handleBackToForm = () => {
  generatedNCP.value = null
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
      <LoadingIndicator
        :messages="[
          'Preparing your nursing care plan...',
          'Analyzing patient data...',
          'Generating recommendations...',
        ]"
        @cancel="handleCancel"
      />
    </div>

    <div v-else class="w-full py-8 px-4 space-y-10">
      <div v-if="generatedNCP" class="space-y-6">
        <NCPDisplay
          :ncp="generatedNCP"
          :format="selectedFormat"
          @back="handleBackToForm"
        />
      </div>

      <div v-else>
        <!-- Page Title -->
        <h1 class="font-poppins text-3xl font-bold mb-2">
          Generate Nursing Care Plan
        </h1>
        <p class="text-muted-foreground mb-8">
          Create an AI-generated nursing care plan based on patient data.
        </p>

        <!-- Format & Assessment Section -->
        <div class="mb-4">
          <h2 class="text-lg font-semibold mb-1">Format & Assessment</h2>
          <p class="text-muted-foreground text-sm mb-4">
            Choose your preferred NCP format and enter assessment details.
          </p>
          <FormatSelector
            :format="selectedFormat"
            @update:format="handleFormatChange"
          />
        </div>

        <!-- Separator -->
        <Separator class="my-6" />

        <!-- Guidance Section -->
        <div class="w-full mb-8">
          <Alert class="p-4 w-full" ref="exampleFormatContainer" v-auto-animate>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <Info class="shrink-0 w-5 h-5" />
                <AlertTitle class="text-base font-semibold mb-0">
                  Formatting Tips & Example
                </AlertTitle>
              </div>
              <button
                class="text-primary hover:underline flex items-center text-sm font-medium ml-4 flex-shrink-0"
                @click="showGuidance = !showGuidance"
              >
                <span v-if="showGuidance">Hide</span>
                <span v-else>Show</span>
                <ChevronDown v-if="!showGuidance" class="w-4 h-4 ml-1" />
                <ChevronUp v-if="showGuidance" class="w-4 h-4 ml-1" />
              </button>
            </div>
            <div v-if="showGuidance" class="mt-4 space-y-6">
              <!-- Formatting Tips -->
              <div>
                <h4 class="font-semibold text-sm mb-2">Formatting Tips</h4>
                <ul class="text-muted-foreground space-y-2 text-sm">
                  <li
                    v-for="(tip, idx) in formattingTips"
                    :key="idx"
                    class="flex items-start space-x-2"
                  >
                    <span class="text-primary font-medium">•</span>
                    <span>{{ tip }}</span>
                  </li>
                </ul>
              </div>
              <!-- Example Format -->
              <div>
                <h4 class="font-semibold text-sm mb-2">Example Format</h4>
                <div
                  v-for="(section, idx) in exampleFormat"
                  :key="idx"
                  class="space-y-3"
                >
                  <div class="flex items-center space-x-2">
                    <component
                      :is="section.icon"
                      class="w-4 h-4 text-primary flex-shrink-0"
                    />
                    <span class="text-sm font-semibold text-foreground">
                      {{ section.label }}
                    </span>
                  </div>
                  <div class="pl-6 space-y-2">
                    <div
                      v-for="(item, i) in section.items"
                      :key="i"
                      class="flex items-start space-x-2 text-sm text-muted-foreground"
                    >
                      <span class="text-primary font-medium mt-1">•</span>
                      <span>{{ item }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Alert>
        </div>

        <!-- Assessment Form -->
        <div class="w-full">
          <h3 class="text-lg font-semibold mb-2">Patient Assessment</h3>
          <p class="text-muted-foreground text-sm mb-4">
            Enter your assessment details to generate an NCP.
          </p>
          <AssessmentForm
            @submit="handleAssessmentSubmit"
            :selectedFormat="selectedFormat"
          />
        </div>
      </div>
    </div>
  </SidebarLayout>
</template>
