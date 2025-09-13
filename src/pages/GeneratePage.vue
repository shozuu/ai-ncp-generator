<script setup>
import AssessmentForm from '@/components/ncp/AssessmentForm.vue'
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import { Alert, AlertTitle } from '@/components/ui/alert'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { ncpService } from '@/services/ncpService'
import { vAutoAnimate } from '@formkit/auto-animate'
import { ChevronDown, ChevronUp, ClipboardMinus, Info } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const selectedFormat = ref('7')
const isLoading = ref(false)
const showGuidance = ref(false)
const exampleFormatContainer = ref(null)
const { toast } = useToast()
const router = useRouter()

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
  try {
    // Check if this is the new comprehensive result with NCP
    if (formData.generatedNCP) {
      console.log('Received complete NCP from comprehensive generation')

      // Data already includes the generated NCP, so we can navigate directly
      const ncps = await ncpService.getUserNCPs()
      const latestNCP = ncps[0]

      toast({
        title: 'Success',
        description:
          'Complete NCP generated successfully with structured format',
        duration: 5000,
      })

      router.push(`/ncps/${latestNCP.id}`)
      return
    }

    // Handle cases where only diagnosis was generated or other fallback scenarios
    if (formData.diagnosis && !formData.generatedNCP) {
      console.log('Only diagnosis was generated, handling fallback')

      toast({
        title: 'Partial Success',
        description: `Diagnosis found: ${formData.diagnosis.diagnosis}. Please try generating again or contact support.`,
        variant: 'destructive',
        duration: 7000,
      })
      return
    }

    // Handle cases where no diagnosis was found
    toast({
      title: 'Generation Issue',
      description:
        'Unable to generate a complete care plan. Please review your assessment data and try again.',
      variant: 'destructive',
      duration: 7000,
    })
  } catch (error) {
    console.error('Generation error:', error)

    // Determine error title and description based on error content
    let errorTitle = 'Generation Failed'
    let errorDescription =
      error.message || 'Failed to generate nursing care plan'

    // Check for specific validation errors
    if (error.message) {
      if (error.message.includes('age is required')) {
        errorTitle = 'Missing Required Information'
        errorDescription =
          "Patient age is recommended. Please ensure your assessment data includes the patient's age, or switch to Assistant Mode for structured input."
      } else if (error.message.includes('sex is required')) {
        errorTitle = 'Missing Required Information'
        errorDescription =
          "Patient sex is required. Please ensure your assessment data includes the patient's sex, or switch to Assistant Mode for structured input."
      } else if (error.message.includes('chief complaint is required')) {
        errorTitle = 'Missing Required Information'
        errorDescription =
          "Chief complaint is required. Please ensure your assessment data includes the main reason for the patient's visit."
      } else if (
        error.message.includes(
          'Unable to extract meaningful clinical information'
        )
      ) {
        errorTitle = 'Insufficient Clinical Data'
        errorDescription =
          'Unable to extract sufficient clinical information from your input. Please provide more detailed patient symptoms, vital signs, physical findings, or medical history.'
      } else if (error.message.includes('parsing')) {
        errorTitle = 'Data Processing Error'
        errorDescription =
          'Failed to process your assessment data. Please check your input format and ensure it contains clear clinical information.'
      }
    }

    toast({
      title: errorTitle,
      description: errorDescription,
      variant: 'destructive',
      duration: 8000,
    })
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
      <LoadingIndicator
        :messages="[
          'Analyzing patient assessment data...',
          'Finding best matching diagnosis...',
          'Generating comprehensive care plan...',
          'Finalizing structured NCP...',
        ]"
      />
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

      <Separator class="my-8" />

      <div class="mb-10">
        <!-- Enhanced Guidance Section -->
        <Alert class="p-4 w-full" ref="exampleFormatContainer" v-auto-animate>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <Info class="shrink-0 w-5 h-5" />
              <AlertTitle class="text-base font-semibold mb-0">
                New: Intelligent Diagnosis Matching & Structured NCP Generation
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
            <!-- New Features Info -->
            <div>
              <h4 class="font-semibold text-sm mb-2 text-primary">
                ✨ Enhanced Features
              </h4>
              <ul class="text-muted-foreground space-y-2 text-sm">
                <li class="flex items-start space-x-2">
                  <span class="text-primary font-medium">🎯</span>
                  <span
                    ><strong>Smart Diagnosis Matching:</strong> AI automatically
                    finds the best NANDA-I diagnosis from a comprehensive
                    database</span
                  >
                </li>
                <li class="flex items-start space-x-2">
                  <span class="text-primary font-medium">📋</span>
                  <span
                    ><strong>Structured NCP Format:</strong> Generates
                    well-organized, professional care plans with consistent
                    formatting</span
                  >
                </li>
                <li class="flex items-start space-x-2">
                  <span class="text-primary font-medium">⚡</span>
                  <span
                    ><strong>One-Step Generation:</strong> Complete
                    assessment-to-NCP workflow in a single process</span
                  >
                </li>
              </ul>
            </div>

            <!-- Formatting Tips -->
            <div>
              <h4 class="font-semibold text-sm mb-2">Input Guidelines</h4>
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
                class="space-y-3 mt-2"
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

      <Separator class="my-8" />

      <div class="mb-10">
        <AssessmentForm
          @submit="handleAssessmentSubmit"
          :selectedFormat="selectedFormat"
        />
      </div>
    </div>
  </SidebarLayout>
</template>
