<script setup>
import AssessmentForm from '@/components/ncp/AssessmentForm.vue'
import FormatSelector from '@/components/ncp/FormatSelector.vue'
import NCPDisplay from '@/components/ncp/NCPDisplay.vue'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import LoadingIndicator from '@/components/ui/loading/LoadingIndicator.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import SidebarLayout from '@/layouts/SidebarLayout.vue'
import { ncpService } from '@/services/ncpService'
import { vAutoAnimate } from '@formkit/auto-animate'
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardMinus,
  Info,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const selectedFormat = ref('7')
const isLoading = ref(false)
const generatedNCP = ref(null)
const showExampleFormat = ref(false)
const exampleFormatContainer = ref(null)
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
    <!-- Full-Page Loading Screen -->
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

    <!-- Main Content -->
    <div v-else class="space-y-8">
      <!-- Generated NCP Display -->
      <div v-if="generatedNCP" class="space-y-6">
        <NCPDisplay
          :ncp="generatedNCP"
          :format="selectedFormat"
          @back="handleBackToForm"
        />
      </div>

      <!-- Form and Format Selection -->
      <div v-else class="space-y-8">
        <div>
          <h1 class="font-poppins text-3xl font-bold">
            Generate Nursing Care Plan
          </h1>
          <p class="text-muted-foreground mt-2">
            Create an AI-generated nursing care plan based on patient data
          </p>
        </div>

        <!-- Format Selection -->
        <Card>
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
        <Card>
          <CardHeader>
            <h3 class="text-lg font-semibold">Patient Assessment</h3>
            <p class="text-muted-foreground text-sm">
              Enter your assessment details to generate an NCP
            </p>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <!-- Formatting Tips Alert -->
              <Alert class="p-4 sm:p-6">
                <div class="flex items-start space-x-3">
                  <Info class="shrink-0 w-5 h-5 mt-0.5" />
                  <AlertTitle class="text-base font-semibold">
                    Formatting Tips
                  </AlertTitle>
                </div>
                <div >
                  <ul class="text-muted-foreground space-y-2 text-sm list-none">
                    <li class="flex items-start space-x-2">
                      <span class="text-primary font-medium">•</span>
                      <span>Enter each finding on a new line.</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <span class="text-primary font-medium">•</span>
                      <span>Use clear and concise statements.</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <span class="text-primary font-medium">•</span>
                      <span
                        >Separate distinct observations for better
                        clarity.</span
                      >
                    </li>
                  </ul>
                </div>
              </Alert>

              <!-- Example Format Alert -->
              <Alert
                class="p-4 sm:p-6"
                ref="exampleFormatContainer"
                v-auto-animate
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-3 flex-1 min-w-0">
                    <CheckCircle class="shrink-0 w-5 h-5 mt-0.5" />
                    <AlertTitle class="text-base font-semibold">
                      Example Format
                    </AlertTitle>
                  </div>
                  <button
                    class="text-primary hover:underline flex items-center text-sm font-medium ml-4 flex-shrink-0"
                    @click="showExampleFormat = !showExampleFormat"
                  >
                    <span v-if="showExampleFormat">Hide</span>
                    <span v-else>Show</span>
                    <ChevronDown
                      v-if="!showExampleFormat"
                      class="w-4 h-4 ml-1"
                    />
                    <ChevronUp v-if="showExampleFormat" class="w-4 h-4 ml-1" />
                  </button>
                </div>

                <div v-if="showExampleFormat" class="mt-4 space-y-6">
                  <!-- Subjective Example -->
                  <div class="space-y-3">
                    <div class="flex items-center space-x-2">
                      <ClipboardMinus
                        class="w-4 h-4 text-primary flex-shrink-0"
                      />
                      <span class="text-sm font-semibold text-foreground">
                        Subjective Data:
                      </span>
                    </div>
                    <div class="pl-6 space-y-2">
                      <div
                        class="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <span class="text-primary font-medium mt-1">•</span>
                        <span
                          >Reports severe headache, described as throbbing (8/10
                          on pain scale)</span
                        >
                      </div>
                      <div
                        class="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <span class="text-primary font-medium mt-1">•</span>
                        <span
                          >States nausea and dizziness began this morning</span
                        >
                      </div>
                      <div
                        class="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <span class="text-primary font-medium mt-1">•</span>
                        <span
                          >Complains of photophobia (sensitivity to light)</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Objective Example -->
                  <div class="space-y-3">
                    <div class="flex items-center space-x-2">
                      <ClipboardMinus
                        class="w-4 h-4 text-primary flex-shrink-0"
                      />
                      <span class="text-sm font-semibold text-foreground">
                        Objective Data:
                      </span>
                    </div>
                    <div class="pl-6 space-y-2">
                      <div
                        class="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <span class="text-primary font-medium mt-1">•</span>
                        <span>Blood pressure: 140/90 mmHg</span>
                      </div>
                      <div
                        class="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <span class="text-primary font-medium mt-1">•</span>
                        <span>Temperature: 38.5°C</span>
                      </div>
                      <div
                        class="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <span class="text-primary font-medium mt-1">•</span>
                        <span>Pupils equal and reactive to light (PERL)</span>
                      </div>
                      <div
                        class="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <span class="text-primary font-medium mt-1">•</span>
                        <span
                          >Facial grimacing observed during head movement</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>

              <AssessmentForm
                @submit="handleAssessmentSubmit"
                :selectedFormat="selectedFormat"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </SidebarLayout>
</template>
