<script setup>
import AssessmentForm from '@/components/ncp/AssessmentForm.vue'
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import { Alert, AlertTitle } from '@/components/ui/alert'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import { useGenerationErrorHandler } from '@/composables/useGenerationErrorHandler'
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
const router = useRouter()
const { handleError, handleSuccess } = useGenerationErrorHandler()

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
    if (formData.generatedNCP) {
      console.log('Received complete NCP from comprehensive generation')
      const ncps = await ncpService.getUserNCPs()
      const latestNCP = ncps[0]

      handleSuccess('complete')
      router.push(`/ncps/${latestNCP.id}`)
      return
    }

    if (formData.diagnosis && !formData.generatedNCP) {
      console.log('Only diagnosis was generated, handling fallback')
      handleSuccess('partial', formData.diagnosis.diagnosis)
      return
    }

    handleSuccess('issue')
  } catch (error) {
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
